export type PerDayRowInput = {
  date: string;
  mealLabel: string;
  leftovers: number;
  served: number;
  refused?: number;
};

export type LeftoversEvolutionPoint = {
  date: string;
  label: string;
  leftovers: number;
  served: number;
  refused: number;
  ratioPct: number | null;
};

function formatDayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function ratioPct(leftovers: number, served: number): number | null {
  if (served <= 0) return null;
  return Math.round((leftovers / served) * 1000) / 10;
}

/** Agrège les lignes journalières (déjeuner) pour le graphique d'évolution. */
export function buildLeftoversEvolutionSeries(
  perDayRows: PerDayRowInput[],
): LeftoversEvolutionPoint[] {
  const byDate = new Map<string, LeftoversEvolutionPoint>();

  for (const row of perDayRows) {
    if (row.mealLabel === "Dîner") continue;

    let point = byDate.get(row.date);
    if (!point) {
      point = {
        date: row.date,
        label: formatDayLabel(row.date),
        leftovers: 0,
        served: 0,
        refused: 0,
        ratioPct: null,
      };
      byDate.set(row.date, point);
    }

    point.leftovers += row.leftovers;
    point.served += row.served;
    point.refused += row.refused ?? 0;
  }

  for (const point of byDate.values()) {
    point.ratioPct = ratioPct(point.leftovers, point.served);
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
