import type { PrismaClient } from "@/generated/prisma/client";
import { MealType } from "@/generated/prisma/client";
import {
  buildAntiWasteKitchenAdvice,
  type AntiWasteKitchenAdvice,
  type LevelMetricInput,
  type PastServiceInsightInput,
} from "@/lib/antiWasteKitchenAdvice";
import {
  buildRiskyDishesRanking,
  buildTodayRiskyDishAlert,
} from "@/lib/antiWasteRiskyDishes";
import { totalGrammagePerPlate } from "@/lib/serviceGrammage";
import { wasteWeightForLevel } from "@/lib/serviceWasteByLevel";

const HISTORY_DAYS = 45;
const cache = new Map<string, PastServiceInsightInput[]>();
const MAX_ENTRIES = 24;

function remember(key: string, past: PastServiceInsightInput[]) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, past);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function stampPart(max: Date | null, count: number) {
  return `${max?.getTime() ?? 0}:${count}`;
}

function historyWindow(serviceDate: Date) {
  const start = new Date(serviceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - HISTORY_DAYS);
  const endExclusive = new Date(serviceDate);
  endExclusive.setHours(0, 0, 0, 0);
  return { start, endExclusive };
}

/** Anciennes pesées, compteurs et menus. Le service du jour n’entre pas dans cette fenêtre. */
async function historyStamp(
  db: PrismaClient,
  establishmentId: string,
  mealType: MealType,
  start: Date,
  endExclusive: Date,
) {
  const whereService = {
    establishmentId,
    mealType,
    date: { gte: start, lt: endExclusive },
  };
  const [service, metrics, menu, menuItem] = await Promise.all([
    db.service.aggregate({
      where: whereService,
      _max: { updatedAt: true },
      _count: true,
    }),
    db.serviceGroupMetrics.aggregate({
      where: { service: whereService },
      _max: { updatedAt: true },
      _count: true,
    }),
    db.menu.aggregate({
      where: { service: whereService },
      _max: { updatedAt: true },
      _count: true,
    }),
    db.menuItem.aggregate({
      where: { menu: { service: whereService } },
      _max: { updatedAt: true },
      _count: true,
    }),
  ]);
  return [
    stampPart(service._max.updatedAt, service._count),
    stampPart(metrics._max.updatedAt, metrics._count),
    stampPart(menu._max.updatedAt, menu._count),
    stampPart(menuItem._max.updatedAt, menuItem._count),
  ].join("|");
}

async function readPastServices(
  db: PrismaClient,
  args: {
    establishmentId: string;
    serviceId: string;
    mealType: MealType;
    start: Date;
    endExclusive: Date;
  },
): Promise<PastServiceInsightInput[]> {
  const stamp = await historyStamp(
    db,
    args.establishmentId,
    args.mealType,
    args.start,
    args.endExclusive,
  );
  const key = [
    args.establishmentId,
    args.mealType,
    args.start.getTime(),
    args.endExclusive.getTime(),
    stamp,
  ].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const past = await db.service.findMany({
    where: {
      establishmentId: args.establishmentId,
      mealType: args.mealType,
      id: { not: args.serviceId },
      date: { gte: args.start, lt: args.endExclusive },
    },
    orderBy: { date: "desc" },
    take: 40,
    select: {
      date: true,
      wasteWeightG: true,
      wasteWeightMaternelleG: true,
      wasteWeightPrimaireG: true,
      menu: {
        select: {
          items: { select: { label: true, category: true } },
        },
      },
      metrics: {
        select: {
          servedCount: true,
          rabCount: true,
        },
      },
    },
  });

  const pastServices = past.map((s) => {
    const items = s.menu?.items ?? [];
    const served = s.metrics.reduce((sum, m) => sum + m.servedCount, 0);
    const rab = s.metrics.reduce((sum, m) => sum + m.rabCount, 0);
    const matG = wasteWeightForLevel(s, "MATERNELLE") ?? 0;
    const primG = wasteWeightForLevel(s, "PRIMAIRE") ?? 0;
    const wasteWeightG =
      (s.wasteWeightG ?? 0) > 0 ? (s.wasteWeightG ?? 0) : matG + primG;
    return {
      date: s.date,
      menuLabels: items.map((i) => i.label).filter((l) => l.trim().length > 0),
      mainLabels: items
        .filter((i) => i.category === "MAIN" && i.label.trim().length > 0)
        .map((i) => i.label),
      wasteWeightG,
      served,
      rab,
    };
  });
  remember(key, pastServices);
  return pastServices;
}

export async function getAntiWasteKitchenAdvice(input: {
  db: PrismaClient;
  establishmentId: string;
  serviceId: string;
  serviceDate: Date;
  mealType: MealType;
  menuItems: { label: string; category: string; grammageG: number | null }[];
  metrics: {
    presentCount: number;
    servedCount: number;
    rabCount: number;
    level: "MATERNELLE" | "PRIMAIRE";
  }[];
  targetGPer100: number | null;
}): Promise<AntiWasteKitchenAdvice> {
  const { start, endExclusive } = historyWindow(input.serviceDate);
  const pastServices = await readPastServices(input.db, {
    establishmentId: input.establishmentId,
    serviceId: input.serviceId,
    mealType: input.mealType,
    start,
    endExclusive,
  });

  const currentLabels = input.menuItems
    .map((i) => i.label)
    .filter((l) => l.trim().length > 0);
  const currentMainLabels = input.menuItems
    .filter((i) => i.category === "MAIN" && i.label.trim().length > 0)
    .map((i) => i.label);

  const levelMetrics: LevelMetricInput[] = input.metrics.map((m) => ({
    level: m.level,
    presentCount: m.presentCount,
    servedCount: m.servedCount,
  }));

  const perPlateBase = totalGrammagePerPlate(input.menuItems);
  const advice = buildAntiWasteKitchenAdvice({
    perPlateBase: perPlateBase > 0 ? perPlateBase : null,
    metrics: levelMetrics,
    currentLabels,
    currentMainLabels,
    pastServices,
    targetGPer100: input.targetGPer100,
  });

  const ranking = buildRiskyDishesRanking(
    pastServices.map((s) => ({
      wasteGramsPer100:
        s.served > 0 && s.wasteWeightG > 0
          ? (s.wasteWeightG / s.served) * 100
          : null,
      menuLabels: s.menuLabels,
      mainLabels: s.mainLabels,
    })),
    input.targetGPer100,
    { limit: 8, preferMain: true },
  );

  return {
    ...advice,
    riskyDishAlert: buildTodayRiskyDishAlert(
      ranking,
      currentMainLabels,
      currentLabels,
      { topN: 5 },
    ),
  };
}
