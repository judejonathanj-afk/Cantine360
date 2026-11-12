import type { PrismaClient } from "@/generated/prisma/client";

function isMissingDbColumn(e: unknown) {
  if (typeof e === "object" && e !== null && "code" in e) {
    if (String((e as { code: unknown }).code) === "P2022") return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return /P2022|does not exist|colonne/i.test(msg);
}

const cache = new Map<string, NonNullable<Awaited<ReturnType<typeof loadService>>>>();
const MAX_ENTRIES = 24;

function remember(
  key: string,
  service: NonNullable<Awaited<ReturnType<typeof loadService>>>,
) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, service);
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function stampPart(max: Date | null, count: number) {
  return `${max?.getTime() ?? 0}:${count}`;
}

/** Menu, pesée, compteurs enregistrés, noms de classes. La saisie encore sur l’appareil ne compte pas. */
async function dataStamp(db: PrismaClient, establishmentId: string, serviceId: string) {
  const [service, metrics, menu, menuItem, group, school] = await Promise.all([
    db.service.aggregate({
      where: { id: serviceId, establishmentId },
      _max: { updatedAt: true },
      _count: true,
    }),
    db.serviceGroupMetrics.aggregate({
      where: { serviceId, service: { establishmentId } },
      _max: { updatedAt: true },
      _count: true,
    }),
    db.menu.aggregate({
      where: { serviceId, service: { establishmentId } },
      _max: { updatedAt: true },
      _count: true,
    }),
    db.menuItem.aggregate({
      where: { menu: { serviceId, service: { establishmentId } } },
      _max: { updatedAt: true },
      _count: true,
    }),
    db.group.aggregate({
      where: { establishmentId },
      _max: { updatedAt: true },
      _count: true,
    }),
    db.school.aggregate({
      where: { establishmentId },
      _max: { updatedAt: true },
      _count: true,
    }),
  ]);
  return [
    stampPart(service._max.updatedAt, service._count),
    stampPart(metrics._max.updatedAt, metrics._count),
    stampPart(menu._max.updatedAt, menu._count),
    stampPart(menuItem._max.updatedAt, menuItem._count),
    stampPart(group._max.updatedAt, group._count),
    stampPart(school._max.updatedAt, school._count),
  ].join("|");
}

const metricsOrderBy = [
  { group: { school: { name: "asc" as const } } },
  { group: { name: "asc" as const } },
];

const menuItemDietSelect = {
  id: true,
  category: true,
  label: true,
  grammageG: true,
  allergens: true,
  createdAt: true,
  containsPork: true,
  containsMeat: true,
  containsBeef: true,
  containsFish: true,
  isHalal: true,
  isKosher: true,
} as const;

const menuItemMinSelect = {
  id: true,
  category: true,
  label: true,
  grammageG: true,
  allergens: true,
  createdAt: true,
} as const;

const groupKitchenSelect = {
  id: true,
  name: true,
  level: true,
  school: { select: { name: true } },
} as const;

const groupKitchenMinSelect = {
  id: true,
  name: true,
  school: { select: { name: true } },
} as const;

function withMenuDietDefaults<T extends { allergens: string[] }>(item: T) {
  const rec = item as T & {
    containsPork?: boolean;
    containsMeat?: boolean;
    containsBeef?: boolean;
    containsFish?: boolean;
    isHalal?: boolean;
    isKosher?: boolean;
  };
  return {
    ...item,
    containsPork: Boolean(rec.containsPork),
    containsMeat: Boolean(rec.containsMeat),
    containsBeef: Boolean(rec.containsBeef),
    containsFish: Boolean(rec.containsFish),
    isHalal: Boolean(rec.isHalal) && !Boolean(rec.containsPork),
    isKosher: Boolean(rec.isKosher) && !Boolean(rec.containsPork),
  };
}

async function loadService(db: PrismaClient, establishmentId: string, serviceId: string) {
  const where = { id: serviceId, establishmentId };

  try {
    const row = await db.service.findFirst({
      where,
      include: {
        menu: { select: { id: true, items: { select: menuItemDietSelect } } },
        metrics: {
          include: { group: { select: groupKitchenSelect } },
          orderBy: metricsOrderBy,
        },
      },
    });
    if (!row) return null;
    return {
      ...row,
      menu: row.menu
        ? {
            ...row.menu,
            items: row.menu.items.map((item) => withMenuDietDefaults(item)),
          }
        : null,
    };
  } catch (e) {
    if (!isMissingDbColumn(e)) throw e;
  }

  const row = await db.service.findFirst({
    where,
    include: {
      menu: { select: { id: true, items: { select: menuItemMinSelect } } },
      metrics: {
        include: { group: { select: groupKitchenMinSelect } },
        orderBy: metricsOrderBy,
      },
    },
  });
  if (!row) return null;
  return {
    ...row,
    menu: row.menu
      ? {
          ...row.menu,
          items: row.menu.items.map((item) => withMenuDietDefaults(item)),
        }
      : null,
    metrics: row.metrics.map((m) => ({
      ...m,
      group: m.group
        ? { ...m.group, level: "PRIMAIRE" as const }
        : m.group,
    })),
  };
}

/** Une lecture de l’écran service. Rejouée si le menu, une pesée ou les compteurs enregistrés changent. */
export async function readServiceScreen(
  db: PrismaClient,
  args: { establishmentId: string; serviceId: string },
) {
  const stamp = await dataStamp(db, args.establishmentId, args.serviceId);
  const key = [args.establishmentId, args.serviceId, stamp].join("|");
  const hit = cache.get(key);
  if (hit) return hit;

  const service = await loadService(db, args.establishmentId, args.serviceId);
  if (service) remember(key, service);
  return service;
}
