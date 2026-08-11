import { redirect } from "next/navigation";
import Link from "next/link";
import { Recycle } from "lucide-react";
import { MealType } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getEstablishmentAntiWasteSettings } from "@/server/establishmentAntiWaste";
import { buildDashboardDayDetailRows } from "@/lib/buildDashboardDayDetailRows";
import { wasteWeightForLevel } from "@/lib/serviceWasteByLevel";
import { buildRiskyDishesRanking } from "@/lib/antiWasteRiskyDishes";
import { AntiWasteModeToggle } from "@/components/admin/AntiWasteModeToggle";
import { AntiWastePanels } from "./AntiWastePanels";
import { cn } from "@/lib/utils";

function AntiWastePageHeader({ days }: { days?: 7 | 30 }) {
  return (
    <header className="flex flex-col items-center text-center">
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
          <Recycle className="h-7 w-7" aria-hidden />
        </span>
        <h1
          className="inline-flex rotate-[-1.5deg] flex-col items-center justify-center rounded-[2.25rem] bg-[#65c495] px-8 py-4 text-white shadow-[0_8px_24px_rgba(101,196,149,0.45)] sm:rounded-[2.75rem] sm:px-10 sm:py-5"
          style={{
            fontFamily:
              "var(--font-fredoka), ui-rounded, system-ui, sans-serif",
          }}
        >
          <span className="text-xl font-semibold lowercase leading-none tracking-wide sm:text-2xl">
            mode
          </span>
          <span className="mt-1 text-3xl font-bold lowercase leading-none tracking-wide sm:text-4xl md:text-[2.75rem]">
            anti-gaspillages
          </span>
        </h1>
      </div>
      <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-emerald-950/90 sm:text-lg">
        Objectif g / 100 assiettes, alertes et tendances pour décider plus vite
        — et ajuster demain la production.
      </p>
      <p className="mt-1.5 max-w-2xl text-sm text-emerald-900/70 sm:text-base">
        {days != null
          ? `Vue commission — déchets, pesées et évolution sur ${days} jours.`
          : "Activez le mode ci-dessous pour afficher la vue commission."}
      </p>
    </header>
  );
}

export default async function AntiWastePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const antiWaste = await getEstablishmentAntiWasteSettings(
    db,
    session.establishmentId,
  );

  const toggle = (
    <AntiWasteModeToggle
      initialEnabled={antiWaste.antiWasteModeEnabled}
      initialTargetGPer100={antiWaste.antiWasteTargetGPer100}
    />
  );

  if (!antiWaste.antiWasteModeEnabled) {
    return (
      <div className="space-y-6">
        <AntiWastePageHeader />
        {toggle}
      </div>
    );
  }

  const sp = await searchParams;
  const days = sp.days === "30" ? 30 : 7;
  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  const services = await db.service.findMany({
    where: {
      date: { gte: start },
      establishmentId: session.establishmentId,
      mealType: MealType.LUNCH,
    },
    orderBy: [{ date: "asc" }],
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
          group: {
            select: {
              id: true,
              name: true,
              level: true,
              school: { select: { name: true } },
            },
          },
        },
      },
      menu: {
        select: {
          items: {
            select: { category: true, label: true, allergens: true },
          },
        },
      },
    },
  });

  const perDayRows = buildDashboardDayDetailRows(services, {
    levelFilter: "all",
    students: [],
  });

  let totalWasteWeightG = 0;
  let totalWasteMaternelleG = 0;
  let totalWastePrimaireG = 0;
  let servicesWithWaste = 0;
  let served = 0;
  let rab = 0;

  for (const s of services) {
    for (const m of s.metrics) {
      served += m.servedCount;
      rab += m.rabCount;
    }
    const matG = wasteWeightForLevel(s, "MATERNELLE") ?? 0;
    const primG = wasteWeightForLevel(s, "PRIMAIRE") ?? 0;
    totalWasteMaternelleG += matG;
    totalWastePrimaireG += primG;
    if ((s.wasteWeightG ?? 0) > 0 || matG > 0 || primG > 0) {
      totalWasteWeightG += s.wasteWeightG ?? matG + primG;
      servicesWithWaste += 1;
    }
  }

  const wasteGramsPer100Served =
    served > 0 && totalWasteWeightG > 0
      ? (totalWasteWeightG / served) * 100
      : null;

  const rabRatePct = new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(served > 0 ? rab / served : 0);

  const missingWeighCount = Math.max(0, services.length - servicesWithWaste);

  const target = antiWaste.antiWasteTargetGPer100;
  let streakAboveTarget = 0;
  if (target != null) {
    for (let i = perDayRows.length - 1; i >= 0; i--) {
      const g = perDayRows[i]?.wasteGramsPer100;
      if (g != null && g > target) streakAboveTarget += 1;
      else break;
    }
  }

  const chartRows = perDayRows.map((r) => ({
    date: r.date,
    wasteWeightG: r.wasteWeightG,
    served: r.served,
  }));

  const riskyDishes = buildRiskyDishesRanking(
    services.map((s) => {
      const dayServed = s.metrics.reduce((sum, m) => sum + m.servedCount, 0);
      const matG = wasteWeightForLevel(s, "MATERNELLE") ?? 0;
      const primG = wasteWeightForLevel(s, "PRIMAIRE") ?? 0;
      const waste =
        (s.wasteWeightG ?? 0) > 0 ? (s.wasteWeightG ?? 0) : matG + primG;
      const items = s.menu?.items ?? [];
      return {
        wasteGramsPer100:
          dayServed > 0 && waste > 0 ? (waste / dayServed) * 100 : null,
        menuLabels: items
          .filter((i) => i.label.trim().length > 0)
          .map((i) => i.label),
        mainLabels: items
          .filter((i) => i.category === "MAIN" && i.label.trim().length > 0)
          .map((i) => i.label),
      };
    }),
    target,
    { limit: 8, preferMain: true },
  );

  return (
    <div className="space-y-6">
      <AntiWastePageHeader days={days} />
      <div className="flex flex-wrap gap-2">
        <Link
          href="/antigaspillage?days=7"
          className={cn(
            "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm",
            days === 7
              ? "bg-emerald-700 text-white"
              : "border border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-50",
          )}
        >
          7 jours
        </Link>
        <Link
          href="/antigaspillage?days=30"
          className={cn(
            "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-sm",
            days === 30
              ? "bg-emerald-700 text-white"
              : "border border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-50",
          )}
        >
          30 jours
        </Link>
      </div>
      {toggle}
      <AntiWastePanels
        days={days}
        targetGPer100={antiWaste.antiWasteTargetGPer100}
        totalWasteWeightG={totalWasteWeightG}
        totalWasteMaternelleG={totalWasteMaternelleG}
        totalWastePrimaireG={totalWastePrimaireG}
        wasteGramsPer100Served={wasteGramsPer100Served}
        rabRatePct={rabRatePct}
        servicesCount={services.length}
        servicesWithWaste={servicesWithWaste}
        missingWeighCount={missingWeighCount}
        streakAboveTarget={streakAboveTarget}
        perDayRows={perDayRows.map((r) => ({
          date: r.date,
          wasteWeightG: r.wasteWeightG,
          wasteWeightMaternelleG: r.wasteWeightMaternelleG,
          wasteWeightPrimaireG: r.wasteWeightPrimaireG,
          wasteGramsPer100: r.wasteGramsPer100,
          rabRatePct: r.rabRatePct,
          weighLabel: r.weighLabel,
          wasteDelta: r.wasteDelta,
        }))}
        chartRows={chartRows}
        riskyDishes={riskyDishes}
      />
    </div>
  );
}
