import type { PrismaClient } from "@/generated/prisma/client";
import { MealType } from "@/generated/prisma/client";
import {
  buildAntiWasteKitchenAdvice,
  type AntiWasteKitchenAdvice,
  type LevelMetricInput,
  type PastServiceInsightInput,
} from "@/lib/antiWasteKitchenAdvice";
import { totalGrammagePerPlate } from "@/lib/serviceGrammage";
import { wasteWeightForLevel } from "@/lib/serviceWasteByLevel";

const HISTORY_DAYS = 45;

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
  const start = new Date(input.serviceDate);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - HISTORY_DAYS);

  const endExclusive = new Date(input.serviceDate);
  endExclusive.setHours(0, 0, 0, 0);

  const past = await input.db.service.findMany({
    where: {
      establishmentId: input.establishmentId,
      mealType: input.mealType,
      id: { not: input.serviceId },
      date: { gte: start, lt: endExclusive },
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

  const pastServices: PastServiceInsightInput[] = past.map((s) => {
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
  return buildAntiWasteKitchenAdvice({
    perPlateBase: perPlateBase > 0 ? perPlateBase : null,
    metrics: levelMetrics,
    currentLabels,
    currentMainLabels,
    pastServices,
    targetGPer100: input.targetGPer100,
  });
}
