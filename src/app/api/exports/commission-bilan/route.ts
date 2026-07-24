import { z } from "zod";
import { NextResponse } from "next/server";
import { excelCsvResponse, unparseCsvSemicolonBody } from "@/lib/csvExport";
import { MealType } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getEstablishmentEcoSettings } from "@/server/establishmentEco";
import { computeCantinePulse } from "@/lib/cantinePulse";
import { servicesToCantinePulseRows, servicesToCantinePulseWasteRows } from "@/lib/cantinePulseRows";
import {
  monthRange,
  ratioRabServisPct,
  sumServiceMetrics,
  sumServiceWasteWeightG,
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

  const rangeStart = isCurrentYear ? ecoBound.priorStart : priorCalendarStart;
  const rangeEndExclusive = isCurrentYear ? ecoBound.currentEndExclusive : calendarYearEndExclusive;

  // Select léger : pas besoin école/classe pour les agrégats bilan / pulse.
  const allServices = await db.service.findMany({
    where: {
      establishmentId: session.establishmentId,
      date: { gte: rangeStart, lt: rangeEndExclusive },
      mealType: MealType.LUNCH,
    },
    orderBy: [{ date: "asc" }, { mealType: "asc" }],
    select: {
      date: true,
      mealType: true,
      wasteWeightG: true,
      wasteWeightMaternelleG: true,
      wasteWeightPrimaireG: true,
      metrics: {
        select: {
          presentCount: true,
          servedCount: true,
          rabCount: true,
          refusedCount: true,
          leftoversCount: true,
        },
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
    const waste = sumServiceWasteWeightG(servicesInYear, {
      mealType: MealType.LUNCH,
      fromInclusive,
      toExclusive,
    });
    const rabRatio = ratioRabServisPct(t.rab, t.served);
    monthly.push({
      Mois: String(m + 1).padStart(2, "0"),
      Présents: t.present,
      Servis: t.served,
      RAB: t.rab,
      "RAB / servis %": rabRatio != null ? Math.round(rabRatio * 100) / 100 : "",
      Refus: t.refused,
      "Déchets (g)": waste.wasteWeightG || "",
      "Déchets maternelle (g)": waste.wasteWeightMaternelleG || "",
      "Déchets primaire (g)": waste.wasteWeightPrimaireG || "",
      "Services avec déchets saisis": waste.servicesWithWaste || "",
    });
  }

  const ytdRows: Array<Record<string, string | number>> = [];
  if (isCurrentYear) {
    const y = sumServiceMetrics(allServices, {
      mealType: MealType.LUNCH,
      fromInclusive: ecoBound.currentStart,
      toExclusive: ecoBound.currentEndExclusive,
    });
    const yWaste = sumServiceWasteWeightG(allServices, {
      mealType: MealType.LUNCH,
      fromInclusive: ecoBound.currentStart,
      toExclusive: ecoBound.currentEndExclusive,
    });
    const rabRatioY = ratioRabServisPct(y.rab, y.served);
    ytdRows.push({
      "YTD présents": y.present,
      "YTD servis": y.served,
      "YTD RAB": y.rab,
      "YTD RAB / servis %": rabRatioY != null ? Math.round(rabRatioY * 100) / 100 : "",
      "YTD refus": y.refused,
      "YTD déchets (g)": yWaste.wasteWeightG || "",
      "YTD déchets maternelle (g)": yWaste.wasteWeightMaternelleG || "",
      "YTD déchets primaire (g)": yWaste.wasteWeightPrimaireG || "",
      "YTD services avec déchets saisis": yWaste.servicesWithWaste || "",
    });
  } else {
    const y = sumServiceMetrics(allServices, {
      mealType: MealType.LUNCH,
      fromInclusive: yearStart,
      toExclusive: calendarYearEndExclusive,
    });
    const yWaste = sumServiceWasteWeightG(allServices, {
      mealType: MealType.LUNCH,
      fromInclusive: yearStart,
      toExclusive: calendarYearEndExclusive,
    });
    const rabRatioY = ratioRabServisPct(y.rab, y.served);
    ytdRows.push({
      "Année présents": y.present,
      "Année servis": y.served,
      "Année RAB": y.rab,
      "Année RAB / servis %": rabRatioY != null ? Math.round(rabRatioY * 100) / 100 : "",
      "Année refus": y.refused,
      "Année déchets (g)": yWaste.wasteWeightG || "",
      "Année déchets maternelle (g)": yWaste.wasteWeightMaternelleG || "",
      "Année déchets primaire (g)": yWaste.wasteWeightPrimaireG || "",
      "Année services avec déchets saisis": yWaste.servicesWithWaste || "",
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
    const pulseWaste = servicesToCantinePulseWasteRows(pulseServices);
    const pulse = computeCantinePulse(pulseRows, MealType.LUNCH, {
      wasteRows: pulseWaste,
    });
    const rabWr = (pulse.meta.curr.rabRate * 100).toFixed(1);
    pulseMeta.push({
      "CantinePulse score /100": pulse.score ?? "",
      Humeur: pulse.mood,
      "Servis cumul 7j": pulse.meta.curr.served,
      "RAB cumul 7j": pulse.meta.curr.rab,
      "Déchets cumul 7j (g)": pulse.meta.curr.wasteWeightG || "",
      "g déchets / 100 assiettes 7j":
        pulse.meta.curr.served > 0 && pulse.meta.curr.wasteWeightG > 0
          ? Math.round(pulse.meta.curr.wasteGramsPer100Served * 10) / 10
          : "",
      "Ratio RAB/servis 7j %": rabWr,
    });
  }

  const sections: string[] = [];
  sections.push(unparseCsvSemicolonBody(metaRows));
  sections.push("");
  sections.push(unparseCsvSemicolonBody(monthly));
  sections.push("");
  sections.push(unparseCsvSemicolonBody(ytdRows));

  if (pulseMeta.length) {
    sections.push("");
    sections.push(unparseCsvSemicolonBody(pulseMeta));
  }

  const csv = `\uFEFFsep=;\r\n${sections.join("\r\n")}`;
  return excelCsvResponse(
    csv,
    `cantine360-bilan-commission-${establishment.slug}-${year}.csv`,
  );
}
