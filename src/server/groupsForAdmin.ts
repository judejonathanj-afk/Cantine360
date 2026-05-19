import type { PrismaClient } from "@/generated/prisma/client";
import { isMissingEcoPeriodColumns } from "@/server/establishmentEco";

export type GroupAdminListRow = {
  id: string;
  name: string;
  active: boolean;
  ecoRestesServisTargetPct: number | null;
  ecoReductionTargetPct: number | null;
};

const GROUP_ECO_SELECT = {
  id: true,
  name: true,
  active: true,
  ecoRestesServisTargetPct: true,
  ecoReductionTargetPct: true,
} as const;

const GROUP_MIN_SELECT = {
  id: true,
  name: true,
  active: true,
} as const;

/**
 * Liste des groupes pour l’admin. Si la migration `group_eco_targets` n’est pas appliquée,
 * retombe sur id/name/active et des objectifs null.
 */
export async function getGroupsForAdmin(
  db: PrismaClient,
  establishmentId: string,
  opts?: { activeOnly?: boolean },
): Promise<GroupAdminListRow[]> {
  const where = opts?.activeOnly
    ? { establishmentId, active: true as const }
    : { establishmentId };
  const orderBy = opts?.activeOnly
    ? ([{ name: "asc" as const }] as const)
    : ([{ active: "desc" as const }, { name: "asc" as const }] as const);

  try {
    return await db.group.findMany({
      where,
      orderBy: [...orderBy],
      select: GROUP_ECO_SELECT,
    });
  } catch (e) {
    if (!isMissingEcoPeriodColumns(e)) throw e;
    const rows = await db.group.findMany({
      where,
      orderBy: [...orderBy],
      select: GROUP_MIN_SELECT,
    });
    return rows.map((r) => ({
      ...r,
      ecoRestesServisTargetPct: null,
      ecoReductionTargetPct: null,
    }));
  }
}
