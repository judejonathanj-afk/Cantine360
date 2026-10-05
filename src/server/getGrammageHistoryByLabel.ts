import { MealType, type PrismaClient } from "@/generated/prisma/client";
import { normalizeDishLabel } from "@/lib/antiWasteKitchenAdvice";
import type { DishWasteHistory } from "@/lib/antiWasteGrammageSuggestion";
import { wasteWeightForLevel } from "@/lib/serviceWasteByLevel";

const HISTORY_DAYS = 90;
const cache = new Map<string, Record<string, DishWasteHistory>>();
const MAX_ENTRIES = 24;

function remember(key: string, history: Record<string, DishWasteHistory>) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, history);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function stampPart(max: Date | null, count: number) {
  return `${max?.getTime() ?? 0}:${count}`;
}

function historyWindow() {
  const endExclusive = new Date();
  endExclusive.setHours(0, 0, 0, 0);
  const start = new Date(endExclusive);
  start.setDate(start.getDate() - HISTORY_DAYS);
  return { start, endExclusive };
}

/** Anciens grammages et pesées. Le jour en cours ne relance pas cette lecture. */
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
  const [service, metrics, menuItem] = await Promise.all([
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
    db.menuItem.aggregate({
      where: { menu: { service: whereService } },
      _max: { updatedAt: true },
      _count: true,
    }),
  ]);
  return [
    stampPart(service._max.updatedAt, service._count),
    stampPart(metrics._max.updatedAt, metrics._count),
    stampPart(menuItem._max.updatedAt, menuItem._count),
  ].join("|");
}

/**
 * Historique par intitulé : grammage moyen + gaspillage (g/100)
 * les jours où ce plat était au menu (même type de repas, même établissement).
 */
export async function getDishWasteHistoryByLabel(
  db: PrismaClient,
  establishmentId: string,
  excludeServiceId: string,
  mealType: MealType = MealType.LUNCH,
): Promise<Record<string, DishWasteHistory>> {
  const { start, endExclusive } = historyWindow();
  const stamp = await historyStamp(db, establishmentId, mealType, start, endExclusive);
  const key = [establishmentId, mealType, start.getTime(), excludeServiceId, stamp].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const services = await db.service.findMany({
    where: {
      establishmentId,
      mealType,
      id: { not: excludeServiceId },
      date: { gte: start, lt: endExclusive },
      menu: { isNot: null },
    },
    take: 60,
    orderBy: { date: "desc" },
    select: {
      wasteWeightG: true,
      wasteWeightMaternelleG: true,
      wasteWeightPrimaireG: true,
      menu: {
        select: {
          items: {
            select: { label: true, grammageG: true },
          },
        },
      },
      metrics: {
        select: { servedCount: true },
      },
    },
  });

  type Acc = {
    grammageTotal: number;
    grammageN: number;
    wasteG100Total: number;
    wasteG100N: number;
    serviceCount: number;
  };
  const byLabel = new Map<string, Acc>();

  for (const s of services) {
    const served = s.metrics.reduce((sum, m) => sum + m.servedCount, 0);
    const matG = wasteWeightForLevel(s, "MATERNELLE") ?? 0;
    const primG = wasteWeightForLevel(s, "PRIMAIRE") ?? 0;
    const wasteWeightG =
      (s.wasteWeightG ?? 0) > 0 ? (s.wasteWeightG ?? 0) : matG + primG;
    const wasteG100 =
      served > 0 && wasteWeightG > 0 ? (wasteWeightG / served) * 100 : null;

    const labelsInService = new Set<string>();
    for (const item of s.menu?.items ?? []) {
      const key = normalizeDishLabel(item.label);
      if (!key) continue;
      labelsInService.add(key);

      const acc = byLabel.get(key) ?? {
        grammageTotal: 0,
        grammageN: 0,
        wasteG100Total: 0,
        wasteG100N: 0,
        serviceCount: 0,
      };
      if (item.grammageG != null && item.grammageG > 0) {
        acc.grammageTotal += item.grammageG;
        acc.grammageN += 1;
      }
      byLabel.set(key, acc);
    }

    for (const key of labelsInService) {
      const acc = byLabel.get(key)!;
      acc.serviceCount += 1;
      if (wasteG100 != null) {
        acc.wasteG100Total += wasteG100;
        acc.wasteG100N += 1;
      }
    }
  }

  const out: Record<string, DishWasteHistory> = {};
  for (const [key, acc] of byLabel) {
    out[key] = {
      avgGrammageG:
        acc.grammageN > 0 ? acc.grammageTotal / acc.grammageN : null,
      avgWasteGPer100:
        acc.wasteG100N > 0 ? acc.wasteG100Total / acc.wasteG100N : null,
      serviceCount: acc.serviceCount,
    };
  }
  remember(key, out);
  return out;
}

/** @deprecated use getDishWasteHistoryByLabel */
export async function getGrammageHistoryByLabel(
  db: PrismaClient,
  establishmentId: string,
  excludeServiceId: string,
  mealType?: MealType,
): Promise<Record<string, number>> {
  const full = await getDishWasteHistoryByLabel(
    db,
    establishmentId,
    excludeServiceId,
    mealType,
  );
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(full)) {
    if (v.avgGrammageG != null) out[k] = v.avgGrammageG;
  }
  return out;
}
