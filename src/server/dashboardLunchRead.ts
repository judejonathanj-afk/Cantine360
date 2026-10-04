import type { PrismaClient } from "@/generated/prisma/client";
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
  return [
    service._max.updatedAt?.getTime() ?? 0,
    metrics._max.updatedAt?.getTime() ?? 0,
    menuItem._max.updatedAt?.getTime() ?? 0,
    student._max.updatedAt?.getTime() ?? 0,
  ].join(":");
}

/** Une lecture des déjeuners. Rejouée seulement si un service, un compteur, un menu ou un élève a changé. */
export async function readDashboardLunches(
  db: PrismaClient,
  args: {
    establishmentId: string;
    from: Date;
    toExclusive: Date;
  },
): Promise<Bundle> {
  const stamp = await dataStamp(db, args.establishmentId);
  const key = [
    args.establishmentId,
    args.from.getTime(),
    args.toExclusive.getTime(),
    stamp,
  ].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const [lunches, students] = await Promise.all([
    db.service.findMany({
      where: {
        establishmentId: args.establishmentId,
        mealType: MealType.LUNCH,
        date: { gte: args.from, lt: args.toExclusive },
      },
      orderBy: [{ date: "asc" }, { mealType: "asc" }],
      select: lunchSelect,
    }),
    db.student.findMany({
      where: { establishmentId: args.establishmentId, active: true },
      select: studentSelect,
    }),
  ]);

  const bundle = { lunches, students };
  remember(key, bundle);
  return bundle;
}
