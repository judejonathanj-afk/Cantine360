export type MenuItemGrammage = {
  label: string;
  category: string;
  grammageG: number | null;
};

export type ServiceMetricsGrammage = {
  presentCount: number;
  servedCount: number;
  rabCount: number;
};

/** Somme des grammages renseignés sur le menu (g par assiette complète). */
export function totalGrammagePerPlate(items: MenuItemGrammage[]): number {
  return items.reduce((sum, i) => sum + (i.grammageG ?? 0), 0);
}

export function formatKgFromGrams(grams: number): string {
  if (grams <= 0) return "0 kg";
  const kg = grams / 1000;
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: kg >= 10 ? 0 : 1,
  }).format(kg) + " kg";
}

export function computeServiceGrammageSummary(
  menuItems: MenuItemGrammage[],
  metrics: ServiceMetricsGrammage[],
) {
  const perPlate = totalGrammagePerPlate(menuItems);
  const itemsWithGrammage = menuItems.filter((i) => i.grammageG != null && i.grammageG > 0);

  const totalServed = metrics.reduce((s, m) => s + m.servedCount, 0);
  const totalPresent = metrics.reduce((s, m) => s + m.presentCount, 0);
  const totalRab = metrics.reduce((s, m) => s + m.rabCount, 0);

  const basisCount = totalServed > 0 ? totalServed : totalPresent;
  const basisLabel = totalServed > 0 ? "servis" : "présents";

  const plannedGrams = perPlate > 0 ? perPlate * basisCount : 0;
  const rabGrams = perPlate > 0 ? perPlate * totalRab : 0;

  return {
    perPlate,
    itemsWithGrammage,
    totalServed,
    totalPresent,
    totalRab,
    basisCount,
    basisLabel,
    plannedGrams,
    rabGrams,
    hasGrammage: perPlate > 0,
  };
}
