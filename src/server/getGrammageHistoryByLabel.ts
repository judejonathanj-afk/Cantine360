import type { PrismaClient } from "@/generated/prisma/client";
import { normalizeDishLabel } from "@/lib/antiWasteKitchenAdvice";

/**
 * Moyenne des grammages saisis par intitulé de plat (établissement),
 * sur les menus récents — pour proposer un g/assiette Antigaspillage.
 */
export async function getGrammageHistoryByLabel(
  db: PrismaClient,
  establishmentId: string,
  excludeServiceId: string,
): Promise<Record<string, number>> {
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
      menu: {
        select: {
          items: {
            select: { label: true, grammageG: true },
            where: { grammageG: { not: null } },
          },
        },
      },
    },
  });

  const sums = new Map<string, { total: number; n: number }>();
  for (const s of services) {
    for (const item of s.menu?.items ?? []) {
      if (item.grammageG == null || item.grammageG <= 0) continue;
      const key = normalizeDishLabel(item.label);
      if (!key) continue;
      const cur = sums.get(key) ?? { total: 0, n: 0 };
      cur.total += item.grammageG;
      cur.n += 1;
      sums.set(key, cur);
    }
  }

  const out: Record<string, number> = {};
  for (const [key, { total, n }] of sums) {
    if (n > 0) out[key] = total / n;
  }
  return out;
}
