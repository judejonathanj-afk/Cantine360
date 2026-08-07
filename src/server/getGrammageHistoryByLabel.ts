import type { PrismaClient } from "@/generated/prisma/client";
import { normalizeDishLabel } from "@/lib/antiWasteKitchenAdvice";
import type { DishWasteHistory } from "@/lib/antiWasteGrammageSuggestion";
import { wasteWeightForLevel } from "@/lib/serviceWasteByLevel";

/**
 * Historique par intitulé : grammage moyen + gaspillage (g/100)
 * les jours où ce plat était au menu.
 */
export async function getDishWasteHistoryByLabel(
  db: PrismaClient,
  establishmentId: string,
  excludeServiceId: string,
): Promise<Record<string, DishWasteHistory>> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 90);

  const services = await db.service.findMany({
    where: {
      establishmentId,
      id: { not: excludeServiceId },
      date: { gte: start },
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
  return out;
}

/** @deprecated use getDishWasteHistoryByLabel */
export async function getGrammageHistoryByLabel(
  db: PrismaClient,
  establishmentId: string,
  excludeServiceId: string,
): Promise<Record<string, number>> {
  const full = await getDishWasteHistoryByLabel(
    db,
    establishmentId,
    excludeServiceId,
  );
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(full)) {
    if (v.avgGrammageG != null) out[k] = v.avgGrammageG;
  }
  return out;
}
