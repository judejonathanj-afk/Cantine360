import { db } from "@/server/db";
import { Prisma } from "@/generated/prisma/client";
import { getServerSession } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardPanels, { type DashboardEcoGroupRow } from "./DashboardPanels";
import {
  servicesToCantinePulseRows,
  type ServiceWithGroupMetrics,
} from "@/lib/cantinePulseRows";
import type { CantineServiceRow } from "@/lib/cantinePulse";
import { EcoObjectivePeriod, MealType } from "@/generated/prisma/client";
import { sumServiceMetrics, sumServiceMetricsForGroup } from "@/lib/commissionBilan";
import {
  ecoObjectiveBounds,
  ecoPeriodTitleFr,
  ecoPriorPhraseFr,
  ecoRestesParenFr,
} from "@/lib/ecoObjectivePeriod";
import { getEstablishmentEcoSettings } from "@/server/establishmentEco";
import { getGroupsForAdmin } from "@/server/groupsForAdmin";

function pct(num: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(num);
}

function explainDbCode(code?: string): string | null {
  if (!code) return null;
  if (code === "ECONNREFUSED" || code === "P1001") {
    return "Connexion refusée : aucun serveur PostgreSQL n’écoute à l’adresse du fichier .env (souvent localhost:5432). Démarre Postgres ou mets une DATABASE_URL cloud (Neon, etc.).";
  }
  if (code === "INIT") {
    return "Impossible d’initialiser le client base de données : vérifie DATABASE_URL et que Postgres accepte les connexions.";
  }
  if (code === "P2021" || code === "P2022") {
    return "Les tables n’existent pas encore sur cette base : exécute les migrations Prisma.";
  }
  return null;
}

function DbSetupHint({ code }: { code?: string }) {
  const hint = explainDbCode(code);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <h1 className="text-xl font-semibold tracking-tight text-amber-950">
          Base de données non prête
        </h1>
        <p className="mt-2 text-sm text-amber-900">
          PostgreSQL doit être joignable (<code className="rounded bg-amber-100 px-1">DATABASE_URL</code>)
          et les tables créées avec les migrations Prisma.
        </p>
        {hint ? (
          <p className="mt-3 rounded-xl bg-amber-100/80 px-3 py-2 text-sm text-amber-950">
            {hint}
          </p>
        ) : null}
        {code ? (
          <p className="mt-2 font-mono text-xs text-amber-800">
            Détail technique : {code}
          </p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        <p className="font-medium text-zinc-900">À faire</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Vérifie que Postgres tourne (local, Docker ou Neon) et que{" "}
            <code className="rounded bg-zinc-100 px-1">.env</code> pointe vers la bonne base.
          </li>
          <li>
            Applique les migrations :{" "}
            <code className="rounded bg-zinc-100 px-1">
              npx prisma migrate deploy
            </code>{" "}
            (prod / Neon) ou{" "}
            <code className="rounded bg-zinc-100 px-1">npm run prisma:migrate</code> en dev.
          </li>
          <li>Rafraîchis cette page.</li>
        </ol>
      </div>
    </div>
  );
}

function isPrismaKnownRequest(e: unknown): e is Prisma.PrismaClientKnownRequestError {
  return (
    typeof e === "object" &&
    e !== null &&
    "name" in e &&
    (e as { name: string }).name === "PrismaClientKnownRequestError"
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const days = sp.days === "30" ? 30 : 7;

  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  const session = await getServerSession();
  if (!session) redirect("/login");

  let services;
  let pulseRows: CantineServiceRow[] = [];
  let wideServices: ServiceWithGroupMetrics[] = [];
  let establishment: {
    ecoRestesServisTargetPct: number | null;
    ecoReductionTargetPct: number | null;
    ecoPeriodKind: EcoObjectivePeriod;
    ecoSchoolYearStartMonth: number;
    ecoSchoolYearStartDay: number;
  } | null = null;
  let ecoBounds = ecoObjectiveBounds(now, "CALENDAR_YEAR", 9, 1);
  /** 14 jours calendaires (incluant aujourd’hui) pour comparaison 7j vs 7j du CantinePulse */
  const pulseRangeStart = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  pulseRangeStart.setHours(0, 0, 0, 0);

  let activeGroupsList: Array<{
    id: string;
    name: string;
    ecoRestesServisTargetPct: number | null;
    ecoReductionTargetPct: number | null;
  }> = [];

  try {
    const [est, agList] = await Promise.all([
      getEstablishmentEcoSettings(db, session.establishmentId),
      getGroupsForAdmin(db, session.establishmentId, { activeOnly: true }),
    ]);
    establishment = est;
    activeGroupsList = agList;

    ecoBounds = ecoObjectiveBounds(
      now,
      est?.ecoPeriodKind ?? "CALENDAR_YEAR",
      est?.ecoSchoolYearStartMonth ?? 9,
      est?.ecoSchoolYearStartDay ?? 1,
    );
    const wideLower = new Date(
      Math.min(pulseRangeStart.getTime(), ecoBounds.priorStart.getTime()),
    );

    const [servicesResult, wide] = await Promise.all([
      db.service.findMany({
        where: {
          date: { gte: start },
          establishmentId: session.establishmentId,
          mealType: MealType.LUNCH,
        },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
        include: {
          metrics: { include: { group: true } },
          menu: { include: { items: { select: { category: true } } } },
        },
      }),
      db.service.findMany({
        where: {
          date: { gte: wideLower, lt: ecoBounds.currentEndExclusive },
          establishmentId: session.establishmentId,
          mealType: MealType.LUNCH,
        },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
        include: {
          metrics: { include: { group: true } },
        },
      }),
    ]);
    services = servicesResult;
    wideServices = wide;
    pulseRows = servicesToCantinePulseRows(
      wide.filter((s) => s.date.getTime() >= pulseRangeStart.getTime()),
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return <DbSetupHint code="INIT" />;
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError || isPrismaKnownRequest(e)) {
      return (
        <DbSetupHint
          code={"code" in e ? String((e as { code: string }).code) : undefined}
        />
      );
    }
    if (e instanceof Error && /ECONNREFUSED|connect\s+ECONNREFUSED/i.test(e.message)) {
      return <DbSetupHint code="ECONNREFUSED" />;
    }
    throw e;
  }

  const totals = services.reduce(
    (acc, s) => {
      for (const m of s.metrics) {
        acc.present += m.presentCount;
        acc.served += m.servedCount;
        acc.refused += m.refusedCount;
        acc.leftovers += m.leftoversCount;
      }
      return acc;
    },
    { present: 0, served: 0, refused: 0, leftovers: 0 },
  );

  const leftoversRate = totals.served > 0 ? totals.leftovers / totals.served : 0;
  const refusalRate = totals.served > 0 ? totals.refused / totals.served : 0;
  const servedVsPresent = totals.present > 0 ? totals.served / totals.present : 0;

  const perDay = new Map<
    string,
    { present: number; served: number; refused: number; leftovers: number }
  >();
  for (const s of services) {
    const key = s.date.toISOString().slice(0, 10);
    const bucket = perDay.get(key) ?? {
      present: 0,
      served: 0,
      refused: 0,
      leftovers: 0,
    };
    for (const m of s.metrics) {
      bucket.present += m.presentCount;
      bucket.served += m.servedCount;
      bucket.refused += m.refusedCount;
      bucket.leftovers += m.leftoversCount;
    }
    perDay.set(key, bucket);
  }

  const topGroups = new Map<
    string,
    { group: string; leftovers: number; refused: number; served: number }
  >();
  for (const s of services) {
    for (const m of s.metrics) {
      const key = m.group.name;
      const b = topGroups.get(key) ?? {
        group: m.group.name,
        leftovers: 0,
        refused: 0,
        served: 0,
      };
      b.leftovers += m.leftoversCount;
      b.refused += m.refusedCount;
      b.served += m.servedCount;
      topGroups.set(key, b);
    }
  }
  const top = Array.from(topGroups.values())
    .sort((a, b) => b.leftovers - a.leftovers)
    .slice(0, 6);

  const perDayRows = Array.from(perDay.entries()).map(([date, v]) => ({
    date,
    mealLabel: "Déjeuner",
    ...v,
  }));

  function ecoSlice() {
    const y = sumServiceMetrics(wideServices, {
      mealType: MealType.LUNCH,
      fromInclusive: ecoBounds.currentStart,
      toExclusive: ecoBounds.currentEndExclusive,
    });
    const p = sumServiceMetrics(wideServices, {
      mealType: MealType.LUNCH,
      fromInclusive: ecoBounds.priorStart,
      toExclusive: ecoBounds.priorEndExclusive,
    });
    return {
      ytdLeftovers: y.leftovers,
      ytdServed: y.served,
      priorYtdLeftovers: p.leftovers,
    };
  }

  const wideForEco = wideServices.map((s) => ({
    date: s.date,
    mealType: s.mealType,
    metrics: s.metrics.map((m) => ({
      groupId: m.group.id,
      presentCount: m.presentCount,
      servedCount: m.servedCount,
      refusedCount: m.refusedCount,
      leftoversCount: m.leftoversCount,
    })),
  }));

  function ecoRowsForMeal(): DashboardEcoGroupRow[] {
    const est = establishment;
    if (activeGroupsList.length === 0) {
      const slice = ecoSlice();
      const r = est?.ecoRestesServisTargetPct ?? null;
      const rd = est?.ecoReductionTargetPct ?? null;
      if (r == null && rd == null) return [];
      return [
        {
          groupName: "Toutes les classes",
          restesServisTargetPct: r,
          reductionTargetPct: rd,
          ytd: { leftovers: slice.ytdLeftovers, served: slice.ytdServed },
          priorYtdLeftovers: slice.priorYtdLeftovers,
        },
      ];
    }
    return activeGroupsList
      .map((g) => {
      const y = sumServiceMetricsForGroup(wideForEco, {
        mealType: MealType.LUNCH,
        groupId: g.id,
        fromInclusive: ecoBounds.currentStart,
        toExclusive: ecoBounds.currentEndExclusive,
      });
      const p = sumServiceMetricsForGroup(wideForEco, {
        mealType: MealType.LUNCH,
        groupId: g.id,
        fromInclusive: ecoBounds.priorStart,
        toExclusive: ecoBounds.priorEndExclusive,
      });
      const restesEff = g.ecoRestesServisTargetPct ?? est?.ecoRestesServisTargetPct ?? null;
      const redEff = g.ecoReductionTargetPct ?? est?.ecoReductionTargetPct ?? null;
      return {
        groupName: g.name,
        restesServisTargetPct: restesEff,
        reductionTargetPct: redEff,
        ytd: { leftovers: y.leftovers, served: y.served },
        priorYtdLeftovers: p.leftovers,
      };
    })
      .filter((row) => row.restesServisTargetPct != null || row.reductionTargetPct != null);
  }

  const groups = ecoRowsForMeal();
  const hasEcoTargets = groups.some(
    (row) => row.restesServisTargetPct != null || row.reductionTargetPct != null,
  );

  const eco = hasEcoTargets
    ? {
        groups,
        periodTitle: ecoPeriodTitleFr(
          establishment?.ecoPeriodKind ?? "CALENDAR_YEAR",
          establishment?.ecoSchoolYearStartMonth ?? 9,
          establishment?.ecoSchoolYearStartDay ?? 1,
        ),
        restesParen: ecoRestesParenFr(establishment?.ecoPeriodKind ?? "CALENDAR_YEAR"),
        priorPhrase: ecoPriorPhraseFr(establishment?.ecoPeriodKind ?? "CALENDAR_YEAR"),
      }
    : null;

  return (
    <DashboardPanels
      days={days === 30 ? 30 : 7}
      role={session.role}
      exportYear={now.getFullYear()}
      pulseRows={pulseRows}
      eco={eco}
      totals={totals}
      leftoversRatePct={pct(leftoversRate)}
      refusalRatePct={pct(refusalRate)}
      servedVsPresentPct={pct(servedVsPresent)}
      top={top.map(({ group, leftovers }) => ({ group, leftovers }))}
      perDayRows={perDayRows}
    />
  );
}

