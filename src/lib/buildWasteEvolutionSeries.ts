export type WastePerDayRowInput = {
  date: string;
  wasteWeightG: number;
  served: number;
};

export type WasteEvolutionPoint = {
  date: string;
  label: string;
  wasteWeightG: number;
  served: number;
  /** Grammes de déchets pour 100 assiettes servies. */
  gramsPer100Served: number | null;
};

function formatDayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function gramsPer100Served(wasteWeightG: number, served: number): number | null {
  if (served <= 0) return null;
  return Math.round((wasteWeightG / served) * 100 * 10) / 10;
}

/** Agrège les grammages déchets journaliers (déjeuner) pour le graphique d'évolution. */
export function buildWasteEvolutionSeries(
  perDayRows: WastePerDayRowInput[],
): WasteEvolutionPoint[] {
  const byDate = new Map<string, WasteEvolutionPoint>();

  for (const row of perDayRows) {
    let point = byDate.get(row.date);
    if (!point) {
      point = {
        date: row.date,
        label: formatDayLabel(row.date),
        wasteWeightG: 0,
        served: 0,
        gramsPer100Served: null,
      };
      byDate.set(row.date, point);
    }

    point.wasteWeightG += row.wasteWeightG;
    point.served += row.served;
  }

  for (const point of byDate.values()) {
    point.gramsPer100Served = gramsPer100Served(point.wasteWeightG, point.served);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
