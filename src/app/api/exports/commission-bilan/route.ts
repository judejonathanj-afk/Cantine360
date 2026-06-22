import { z } from "zod";
import Papa from "papaparse";
import { NextResponse } from "next/server";
import { MealType } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getEstablishmentEcoSettings } from "@/server/establishmentEco";
import { computeCantinePulse } from "@/lib/cantinePulse";
import { servicesToCantinePulseRows } from "@/lib/cantinePulseRows";
import {
  leftoversReductionVsPriorPct,
  monthRange,
  ratioRabServisPct,
  ratioRestesServisPct,
  sumServiceMetrics,
} from "@/lib/commissionBilan";
import { ecoObjectiveBounds, ecoPeriodTitleFr } from "@/lib/ecoObjectivePeriod";

const YearSchema = z.coerce.number().int().min(2020).max(2035);

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé administrateur" }, { status: 403 });
  }

  const url = new URL(req.url);
  const yearParsed = YearSchema.safeParse(
    url.searchParams.get("year") ?? String(new Date().getFullYear()),
  );
  if (!yearParsed.success) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 });
  }
  const year = yearParsed.data;
  const now = new Date();

  const [establishmentBase, establishmentEco] = await Promise.all([
    db.establishment.findUnique({
      where: { id: session.establishmentId },
      select: { name: true, slug: true },
    }),
    getEstablishmentEcoSettings(db, session.establishmentId),
  ]);
  if (!establishmentBase || !establishmentEco) {
    return NextResponse.json({ error: "Établissement introuvable" }, { status: 404 });
  }
  const establishment = { ...establishmentBase, ...establishmentEco };

  const yearStart = new Date(year, 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  const calendarYearEndExclusive = new Date(year + 1, 0, 1);
  calendarYearEndExclusive.setHours(0, 0, 0, 0);
  const yearEndExclusive =
    year < now.getFullYear()
      ? calendarYearEndExclusive
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  yearEndExclusive.setHours(0, 0, 0, 0);

  const ecoBound = ecoObjectiveBounds(
    now,
    establishment.ecoPeriodKind,
    establishment.ecoSchoolYearStartMonth,
    establishment.ecoSchoolYearStartDay,
  );
  const isCurrentYear = year === now.getFullYear();

  const priorCalendarStart = new Date(year - 1, 0, 1);
  priorCalendarStart.setHours(0, 0, 0, 0);
  const priorCalendarEndExclusive = new Date(year, 0, 1);
  priorCalendarEndExclusive.setHours(0, 0, 0, 0);

  const rangeStart = isCurrentYear ? ecoBound.priorStart : priorCalendarStart;
  const rangeEndExclusive = isCurrentYear ? ecoBound.currentEndExclusive : calendarYearEndExclusive;

  const allServices = await db.service.findMany({
    where: {
      establishmentId: session.establishmentId,
      date: { gte: rangeStart, lt: rangeEndExclusive },
      mealType: MealType.LUNCH,
    },
    orderBy: [{ date: "asc" }, { mealType: "asc" }],
    include: {
      metrics: {
        orderBy: [{ group: { name: "asc" } }],
        include: { group: { include: { school: true } } },
      },
    },
  });

  const servicesInYear = isCurrentYear
    ? allServices.filter((s) => s.date.getTime() >= yearStart.getTime())
    : allServices.filter(
        (s) =>
          s.date.getTime() >= yearStart.getTime() &&
          s.date.getTime() < calendarYearEndExclusive.getTime(),
      );

  const metaRows = [
    { Clé: "Établissement", Valeur: establishment.name },
    { Clé: "Code", Valeur: establishment.slug },
    { Clé: "Année bilan", Valeur: String(year) },
    { Clé: "Généré le (UTC)", Valeur: now.toISOString().slice(0, 19) },
    {
      Clé: "Objectif ratio restes/servis (%)",
      Valeur:
        establishment.ecoRestesServisTargetPct != null
          ? String(establishment.ecoRestesServisTargetPct)
          : "",
    },
    {
      Clé: "Objectif baisse restes vs N-1 (%)",
      Valeur:
        establishment.ecoReductionTargetPct != null ? String(establishment.ecoReductionTargetPct) : "",
    },
    {
      Clé: "Période objectifs (dashboard)",
      Valeur: ecoPeriodTitleFr(
        establishment.ecoPeriodKind,
        establishment.ecoSchoolYearStartMonth,
        establishment.ecoSchoolYearStartDay,
      ),
    },
  ];

  const lastMonthIdx = year < now.getFullYear() ? 11 : now.getMonth();
  const monthly: Array<Record<string, string | number>> = [];
  for (let m = 0; m <= lastMonthIdx; m++) {
    const { fromInclusive, toExclusive } = monthRange(year, m);
    const t = sumServiceMetrics(servicesInYear, {
      mealType: MealType.LUNCH,
      fromInclusive,
      toExclusive,
    });
    const ratio = ratioRestesServisPct(t.leftovers, t.served);
    const rabRatio = ratioRabServisPct(t.rab, t.served);
    monthly.push({
      Mois: String(m + 1).padStart(2, "0"),
      Présents: t.present,
      Servis: t.served,
      RAB: t.rab,
      "RAB / servis %": rabRatio != null ? Math.round(rabRatio * 100) / 100 : "",
      Refus: t.refused,
      Restes: t.leftovers,
      "Ratio restes/servis %": ratio != null ? Math.round(ratio * 100) / 100 : "",
    });
  }

  const ytdRows: Array<Record<string, string | number>> = [];
  if (isCurrentYear) {
    const y = sumServiceMetrics(allServices, {
      mealType: MealType.LUNCH,
      fromInclusive: ecoBound.currentStart,
      toExclusive: ecoBound.currentEndExclusive,
    });
    const p = sumServiceMetrics(allServices, {
      mealType: MealType.LUNCH,
      fromInclusive: ecoBound.priorStart,
      toExclusive: ecoBound.priorEndExclusive,
    });
    const ratioY = ratioRestesServisPct(y.leftovers, y.served);
    const rabRatioY = ratioRabServisPct(y.rab, y.served);
    const reduc = leftoversReductionVsPriorPct(y.leftovers, p.leftovers);
    ytdRows.push({
      "YTD présents": y.present,
      "YTD servis": y.served,
      "YTD RAB": y.rab,
      "YTD RAB / servis %": rabRatioY != null ? Math.round(rabRatioY * 100) / 100 : "",
      "YTD refus": y.refused,
      "YTD restes": y.leftovers,
      "YTD ratio restes/servis %": ratioY != null ? Math.round(ratioY * 100) / 100 : "",
      "N-1 même période (restes)": p.leftovers,
      "Baisse restes % vs N-1": reduc != null ? Math.round(reduc * 100) / 100 : "",
    });
  } else {
    const y = sumServiceMetrics(allServices, {
      mealType: MealType.LUNCH,
      fromInclusive: yearStart,
      toExclusive: calendarYearEndExclusive,
    });
    const p = sumServiceMetrics(allServices, {
      mealType: MealType.LUNCH,
      fromInclusive: priorCalendarStart,
      toExclusive: priorCalendarEndExclusive,
    });
    const ratioY = ratioRestesServisPct(y.leftovers, y.served);
    const rabRatioY = ratioRabServisPct(y.rab, y.served);
    const reduc = leftoversReductionVsPriorPct(y.leftovers, p.leftovers);
    ytdRows.push({
      "Année présents": y.present,
      "Année servis": y.served,
      "Année RAB": y.rab,
      "Année RAB / servis %": rabRatioY != null ? Math.round(rabRatioY * 100) / 100 : "",
      "Année refus": y.refused,
      "Année restes": y.leftovers,
      "Année ratio restes/servis %": ratioY != null ? Math.round(ratioY * 100) / 100 : "",
      "N-1 année complète (restes)": p.leftovers,
      "Baisse restes % vs N-1": reduc != null ? Math.round(reduc * 100) / 100 : "",
    });
  }

  const pulseStart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  pulseStart.setHours(0, 0, 0, 0);
  const pulseServices = isCurrentYear
    ? allServices.filter((s) => s.date.getTime() >= pulseStart.getTime())
    : [];

  const pulseMeta: Array<Record<string, string | number>> = [];
  if (isCurrentYear && pulseServices.length > 0) {
    const pulseRows = servicesToCantinePulseRows(pulseServices);
    const pulse = computeCantinePulse(pulseRows, MealType.LUNCH);
    const wr = (pulse.meta.curr.wasteRate * 100).toFixed(1);
    const rabWr = (pulse.meta.curr.rabRate * 100).toFixed(1);
    pulseMeta.push({
      "CantinePulse score /100": pulse.score ?? "",
      Humeur: pulse.mood,
      "Restes cumul 7j": pulse.meta.curr.leftovers,
      "Servis cumul 7j": pulse.meta.curr.served,
      "RAB cumul 7j": pulse.meta.curr.rab,
      "Ratio restes/servis 7j %": wr,
      "Ratio RAB/servis 7j %": rabWr,
    });
  }

  const sections: string[] = [];
  sections.push(Papa.unparse(metaRows, { delimiter: ";", quotes: true }));
  sections.push("");
  sections.push(Papa.unparse(monthly, { delimiter: ";", quotes: true }));

  sections.push("");
  sections.push(
    Papa.unparse(ytdRows, {
      delimiter: ";",
      quotes: true,
    }),
  );

  if (pulseMeta.length) {
    sections.push("");
    sections.push(
      Papa.unparse(pulseMeta, {
        delimiter: ";",
        quotes: true,
      }),
    );
  }

  const csv = "\uFEFF" + sections.join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cantine360-bilan-commission-${establishment.slug}-${year}.csv"`,
    },
  });
}
