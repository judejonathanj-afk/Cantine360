import type { PrismaClient } from "@/generated/prisma/client";
import { MealType } from "@/generated/prisma/client";

const serviceSelect = {
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
} as const;

const cache = new Map<string, Awaited<ReturnType<typeof loadServices>>>();
const MAX_ENTRIES = 24;

function remember(key: string, services: Awaited<ReturnType<typeof loadServices>>) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, services);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function stampPart(max: Date | null, count: number) {
  return `${max?.getTime() ?? 0}:${count}`;
}

/** Pesée, compteurs, menu. Le compteur attrape aussi une suppression. */
async function dataStamp(db: PrismaClient, establishmentId: string): Promise<string> {
  const whereService = { establishmentId, mealType: MealType.LUNCH };
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

async function loadServices(db: PrismaClient, establishmentId: string, from: Date) {
  return db.service.findMany({
    where: {
      date: { gte: from },
      establishmentId,
      mealType: MealType.LUNCH,
    },
    orderBy: [{ date: "asc" }],
    select: serviceSelect,
  });
}

/** Une lecture des services anti-gaspi. Rejouée seulement si une pesée, un compteur ou un menu a changé. */
export async function readAntiWasteServices(
  db: PrismaClient,
  args: { establishmentId: string; from: Date },
) {
  const stamp = await dataStamp(db, args.establishmentId);
  const key = [args.establishmentId, args.from.getTime(), stamp].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const services = await loadServices(db, args.establishmentId, args.from);
  remember(key, services);
  return services;
}
