import type { SchoolLevel } from "@/lib/schoolLevel";

export type LevelMealTotals = {
  present: number;
  served: number;
  rab: number;
  refused: number;
};

export type LevelComparisonBar = {
  metric: string;
  maternelle: number;
  primaire: number;
};

function emptyTotals(): LevelMealTotals {
  return { present: 0, served: 0, rab: 0, refused: 0 };
}

function ratePct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Agrège les compteurs par cycle scolaire (maternelle / primaire). */
export function aggregateTotalsByLevel(
  rows: Array<{
    level?: string | null;
    presentCount: number;
    servedCount: number;
    rabCount: number;
    refusedCount: number;
  }>,
): Record<SchoolLevel, LevelMealTotals> {
  const out: Record<SchoolLevel, LevelMealTotals> = {
    MATERNELLE: emptyTotals(),
    PRIMAIRE: emptyTotals(),
  };

  for (const row of rows) {
    const level: SchoolLevel =
      row.level === "MATERNELLE" ? "MATERNELLE" : "PRIMAIRE";
    const bucket = out[level];
    bucket.present += row.presentCount;
    bucket.served += row.servedCount;
    bucket.rab += row.rabCount;
    bucket.refused += row.refusedCount;
  }

  return out;
}

/** Barres côte à côte : taux de service, RAB, refus (%). */
export function buildLevelComparisonBars(
  byLevel: Record<SchoolLevel, LevelMealTotals>,
): LevelComparisonBar[] {
  const mat = byLevel.MATERNELLE;
  const prim = byLevel.PRIMAIRE;

  return [
    {
      metric: "Taux de service",
      maternelle: ratePct(mat.served, mat.present),
      primaire: ratePct(prim.served, prim.present),
    },
    {
      metric: "Taux RAB",
      maternelle: ratePct(mat.rab, mat.served),
      primaire: ratePct(prim.rab, prim.served),
    },
    {
      metric: "Taux refus",
      maternelle: ratePct(mat.refused, mat.served),
      primaire: ratePct(prim.refused, prim.served),
    },
  ];
}

export function levelComparisonHasData(
  byLevel: Record<SchoolLevel, LevelMealTotals>,
): boolean {
  return (
    byLevel.MATERNELLE.present > 0 ||
    byLevel.MATERNELLE.served > 0 ||
    byLevel.PRIMAIRE.present > 0 ||
    byLevel.PRIMAIRE.served > 0
  );
}
