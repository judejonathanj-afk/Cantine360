import type { SchoolLevel } from "@/lib/schoolLevel";

export type ServiceWasteWeights = {
  wasteWeightG?: number | null;
  wasteWeightMaternelleG?: number | null;
  wasteWeightPrimaireG?: number | null;
};

/** Total = somme des cycles ; null si aucun poids renseigné. */
export function totalWasteFromLevels(
  maternelleG: number | null | undefined,
  primaireG: number | null | undefined,
): number | null {
  const m = maternelleG != null && maternelleG > 0 ? maternelleG : 0;
  const p = primaireG != null && primaireG > 0 ? primaireG : 0;
  const sum = m + p;
  return sum > 0 ? sum : null;
}

function hasLevelSplit(service: ServiceWasteWeights): boolean {
  return (
    service.wasteWeightMaternelleG != null || service.wasteWeightPrimaireG != null
  );
}

/**
 * Poids pour un cycle.
 * - Priorité aux champs maternelle / primaire.
 * - Sinon (données legacy) : répartition au prorata des assiettes servies.
 */
export function wasteWeightForLevel(
  service: ServiceWasteWeights,
  level: SchoolLevel,
  servedByLevel?: Record<SchoolLevel, number>,
): number {
  const specific =
    level === "MATERNELLE"
      ? service.wasteWeightMaternelleG
      : service.wasteWeightPrimaireG;

  if (hasLevelSplit(service)) {
    return specific != null && specific > 0 ? specific : 0;
  }

  const total = service.wasteWeightG;
  if (total == null || total <= 0) return 0;
  if (!servedByLevel) return 0;

  const shareMat = servedByLevel.MATERNELLE;
  const sharePrim = servedByLevel.PRIMAIRE;
  const servedTotal = shareMat + sharePrim;
  if (servedTotal <= 0) return 0;
  return total * (servedByLevel[level] / servedTotal);
}
