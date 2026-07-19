export type MealFlowDayInput = {
  date: string;
  present: number;
  served: number;
  rab: number;
  refused: number;
};

export type MealFlowPoint = {
  date: string;
  label: string;
  present: number;
  served: number;
  rab: number;
  refused: number;
};

function formatDayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

/** Agrège présents / servis / RAB / refus par jour pour le graphique « flux du repas ». */
export function buildMealFlowSeries(perDayRows: MealFlowDayInput[]): MealFlowPoint[] {
  const byDate = new Map<string, MealFlowPoint>();

  for (const row of perDayRows) {
    let point = byDate.get(row.date);
    if (!point) {
      point = {
        date: row.date,
        label: formatDayLabel(row.date),
        present: 0,
        served: 0,
        rab: 0,
        refused: 0,
      };
      byDate.set(row.date, point);
    }

    point.present += row.present;
    point.served += row.served;
    point.rab += row.rab;
    point.refused += row.refused;
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
