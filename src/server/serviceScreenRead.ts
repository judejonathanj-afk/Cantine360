import type { PrismaClient } from "@/generated/prisma/client";

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

async function loadService(db: PrismaClient, establishmentId: string, serviceId: string) {
  return db.service.findFirst({
    where: { id: serviceId, establishmentId },
    include: {
      menu: { include: { items: true } },
      metrics: {
        include: { group: { include: { school: true } } },
        orderBy: [{ group: { school: { name: "asc" } } }, { group: { name: "asc" } }],
      },
    },
  });
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
