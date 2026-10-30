import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { MealType } from "@/generated/prisma/client";

const lunchSelect = {
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
} as const;

export type DashboardLunchRow = Prisma.ServiceGetPayload<{
  select: typeof lunchSelect;
}>;

const studentSelect = {
  id: true,
  allergens: true,
  groupId: true,
} as const;

export type DashboardStudentRow = {
  id: string;
  allergens: string[];
  groupId: string;
};

type Bundle = {
  lunches: DashboardLunchRow[];
  students: DashboardStudentRow[];
};

const cache = new Map<string, Bundle>();
const MAX_ENTRIES = 24;
const stampMemo = new Map<string, { at: number; stamp: string }>();
const STAMP_TTL_MS = 12_000;

function remember(key: string, bundle: Bundle) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, bundle);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

async function dataStamp(db: PrismaClient, establishmentId: string): Promise<string> {
  const now = Date.now();
  const prev = stampMemo.get(establishmentId);
  if (prev && now - prev.at < STAMP_TTL_MS) return prev.stamp;

  const whereService = { establishmentId, mealType: MealType.LUNCH };
  const [service, metrics, menuItem, student] = await Promise.all([
    db.service.aggregate({ where: whereService, _max: { updatedAt: true } }),
    db.serviceGroupMetrics.aggregate({
      where: { service: whereService },
      _max: { updatedAt: true },
    }),
    db.menuItem.aggregate({
      where: { menu: { service: whereService } },
      _max: { updatedAt: true },
    }),
    db.student.aggregate({
      where: { establishmentId },
      _max: { updatedAt: true },
    }),
  ]);
  const stamp = [
    service._max.updatedAt?.getTime() ?? 0,
    metrics._max.updatedAt?.getTime() ?? 0,
    menuItem._max.updatedAt?.getTime() ?? 0,
    student._max.updatedAt?.getTime() ?? 0,
  ].join(":");
  stampMemo.set(establishmentId, { at: now, stamp });
  return stamp;
}

/** Une lecture des déjeuners. Rejouée seulement si un service, un compteur, un menu ou un élève a changé. */
export async function readDashboardLunches(
  db: PrismaClient,
  args: {
    establishmentId: string;
    from: Date;
    toExclusive: Date;
    /** Sans menus ni élèves : assez pour les objectifs éco sur une longue période. */
    metricsOnly?: boolean;
  },
): Promise<Bundle> {
  const stamp = await dataStamp(db, args.establishmentId);
  const key = [
    args.establishmentId,
    args.from.getTime(),
    args.toExclusive.getTime(),
    args.metricsOnly ? "m" : "f",
    stamp,
  ].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const lunchWhere = {
    establishmentId: args.establishmentId,
    mealType: MealType.LUNCH,
    date: { gte: args.from, lt: args.toExclusive },
  };

  const [lunches, students] = await Promise.all([
    db.service.findMany({
      where: lunchWhere,
      orderBy: [{ date: "asc" }, { mealType: "asc" }],
      select: args.metricsOnly
        ? {
            date: true,
            mealType: true,
            wasteWeightG: true,
            wasteWeightMaternelleG: true,
            wasteWeightPrimaireG: true,
            metrics: lunchSelect.metrics,
          }
        : lunchSelect,
    }),
    args.metricsOnly
      ? Promise.resolve([])
      : db.student.findMany({
          where: { establishmentId: args.establishmentId, active: true },
          select: studentSelect,
        }),
  ]);

  const bundle: Bundle = {
    lunches: lunches as DashboardLunchRow[],
    students,
  };
  remember(key, bundle);
  return bundle;
}
