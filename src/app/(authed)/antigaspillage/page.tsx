import { redirect } from "next/navigation";
import { Recycle } from "lucide-react";
import { MealType } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getEstablishmentAntiWasteSettings } from "@/server/establishmentAntiWaste";
import { buildDashboardDayDetailRows } from "@/lib/buildDashboardDayDetailRows";
import { wasteWeightForLevel } from "@/lib/serviceWasteByLevel";
import { AntiWasteModeToggle } from "@/components/admin/AntiWasteModeToggle";
import { AntiWastePanels } from "./AntiWastePanels";

function AntiWastePageHeader({ days }: { days?: 7 | 30 }) {
  return (
    <header className="flex flex-col items-center text-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
        <Recycle className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">
        Mode Antigaspillage
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-emerald-900/80 sm:text-base">
        {days != null
          ? `Vue commission — déchets, g / 100 assiettes, pesées et tendance sur ${days} jours.`
          : "Activez le mode pour suivre déchets, objectif et tendances en commission."}
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

  return (
    <div className="space-y-6">
      <AntiWastePageHeader days={days} />
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
      />
    </div>
  );
}
