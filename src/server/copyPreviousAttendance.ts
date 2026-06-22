import type { PrismaClient } from "@/generated/prisma/client";

export type CopyPreviousAttendanceResult =
  | {
      ok: true;
      groupsUpdated: number;
      previousDate: string;
    }
  | {
      ok: false;
      reason: "NOT_FOUND" | "NO_PREVIOUS";
    };

/** Applique les présents du service précédent aux groupes communs. */
export function mapPreviousPresentCounts(
  currentGroupIds: string[],
  previousMetrics: { groupId: string; presentCount: number }[],
): { groupId: string; presentCount: number }[] {
  const previousByGroup = new Map(
    previousMetrics.map((m) => [m.groupId, m.presentCount]),
  );
  return currentGroupIds
    .filter((groupId) => previousByGroup.has(groupId))
    .map((groupId) => ({
      groupId,
      presentCount: previousByGroup.get(groupId)!,
    }));
}

function formatServiceDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function copyPreviousDayPresentCounts(
  db: PrismaClient,
  establishmentId: string,
  serviceId: string,
): Promise<CopyPreviousAttendanceResult> {
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId },
    select: { id: true, date: true, mealType: true },
  });
  if (!service) return { ok: false, reason: "NOT_FOUND" };

  const previousService = await db.service.findFirst({
    where: {
      establishmentId,
      mealType: service.mealType,
      date: { lt: service.date },
    },
    orderBy: { date: "desc" },
    include: {
      metrics: {
        select: { groupId: true, presentCount: true },
      },
    },
  });

  if (!previousService) return { ok: false, reason: "NO_PREVIOUS" };

  const currentMetrics = await db.serviceGroupMetrics.findMany({
    where: { serviceId },
    select: { groupId: true },
  });

  const updates = mapPreviousPresentCounts(
    currentMetrics.map((m) => m.groupId),
    previousService.metrics,
  );

  if (updates.length > 0) {
    await db.$transaction(
      updates.map(({ groupId, presentCount }) =>
        db.serviceGroupMetrics.update({
          where: {
            serviceId_groupId: { serviceId, groupId },
          },
          data: { presentCount },
        }),
      ),
    );
  }

  return {
    ok: true,
    groupsUpdated: updates.length,
    previousDate: formatServiceDateKey(previousService.date),
  };
}
