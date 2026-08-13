import { redirect } from "next/navigation";
import { MealType } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getEstablishmentAntiWasteSettings } from "@/server/establishmentAntiWaste";
import { buildDashboardDayDetailRows } from "@/lib/buildDashboardDayDetailRows";
import { wasteWeightForLevel } from "@/lib/serviceWasteByLevel";
import { buildRiskyDishesRanking } from "@/lib/antiWasteRiskyDishes";
import { mealTypeLabelFr } from "@/lib/mealType";
import { AntiWasteModeToggle } from "@/components/admin/AntiWasteModeToggle";
import { AntiWastePanels } from "./AntiWastePanels";
import { Leaf } from "lucide-react";

const MENU_CATEGORY_FR: Record<string, string> = {
  STARTER: "Entrée",
  MAIN: "Plat",
  DESSERT: "Dessert",
  OTHER: "Autre",
};

function formatMissingWeighMenu(
  items: { category: string; label: string }[],
): string {
  const filled = items.filter((i) => i.label.trim().length > 0);
  if (filled.length === 0) return "Menu non renseigné";

  const byCat = new Map<string, string>();
  for (const item of filled) {
    const key = MENU_CATEGORY_FR[item.category] ?? item.category;
    if (!byCat.has(key)) byCat.set(key, item.label.trim());
  }

  const order = ["Entrée", "Plat", "Dessert", "Autre"];
  const parts: string[] = [];
  for (const cat of order) {
    const label = byCat.get(cat);
    if (label) parts.push(`${cat} : ${label}`);
  }
  for (const [cat, label] of byCat) {
    if (!order.includes(cat)) parts.push(`${cat} : ${label}`);
  }
  return parts.join(" · ");
}

function formatMissingWeighDate(date: Date): string {
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function AntiWasteOffHeader() {
  return (
    <div className="anti-waste-dash flex items-start gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <Leaf className="size-5" aria-hidden />
      </div>
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Cantine 360
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Mode anti-gaspillage
        </h1>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Le mode anti-gaspillage aide la cuisine et la commission à réduire les
          restes : fixez un objectif en grammes pour 100 assiettes, puis activez
          le mode ci-dessous pour afficher la synthèse, les plats à risque,
          l’évolution et le détail jour par jour.
        </p>
      </div>
    </div>
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

  if (!antiWaste.antiWasteModeEnabled) {
    return (
      <div className="space-y-6">
        <AntiWasteOffHeader />
        <AntiWasteModeToggle
          initialEnabled={antiWaste.antiWasteModeEnabled}
          initialTargetGPer100={antiWaste.antiWasteTargetGPer100}
          schemaReady={antiWaste.schemaReady}
        />
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
      id: true,
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
  const missingWeighServices = services
    .filter((s) => {
      const matG = wasteWeightForLevel(s, "MATERNELLE") ?? 0;
      const primG = wasteWeightForLevel(s, "PRIMAIRE") ?? 0;
      return !((s.wasteWeightG ?? 0) > 0 || matG > 0 || primG > 0);
    })
    .map((s) => {
      const servedCount = s.metrics.reduce((sum, m) => sum + m.servedCount, 0);
      return {
        id: s.id,
        dateLabel: formatMissingWeighDate(s.date),
        mealLabel: mealTypeLabelFr(s.mealType),
        menuSummary: formatMissingWeighMenu(s.menu?.items ?? []),
        servedCount,
      };
    })
    .reverse();

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
    <AntiWastePanels
      days={days}
      targetGPer100={antiWaste.antiWasteTargetGPer100}
      modeEnabled={antiWaste.antiWasteModeEnabled}
      schemaReady={antiWaste.schemaReady}
      totalWasteWeightG={totalWasteWeightG}
      totalWasteMaternelleG={totalWasteMaternelleG}
      totalWastePrimaireG={totalWastePrimaireG}
      wasteGramsPer100Served={wasteGramsPer100Served}
      rabRatePct={rabRatePct}
      servicesCount={services.length}
      servicesWithWaste={servicesWithWaste}
      missingWeighCount={missingWeighCount}
      missingWeighServices={missingWeighServices}
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
  );
}
