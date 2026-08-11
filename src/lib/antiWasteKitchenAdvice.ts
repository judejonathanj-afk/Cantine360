import { formatKgFromGrams } from "@/lib/serviceGrammage";

/** Portion maternelle ≈ 75 % du grammage assiette (référence primaire). */
export const MATERNELLE_PORTION_FACTOR = 0.75;
export const PRIMAIRE_PORTION_FACTOR = 1;

export type LevelKey = "MATERNELLE" | "PRIMAIRE";

export type LevelMetricInput = {
  level: LevelKey;
  presentCount: number;
  servedCount: number;
};

export type PastServiceInsightInput = {
  date: Date;
  menuLabels: string[];
  mainLabels: string[];
  wasteWeightG: number;
  served: number;
  rab: number;
};

export type LevelPortionSuggestion = {
  level: LevelKey;
  levelLabel: string;
  headcount: number;
  basisLabel: "présents" | "servis";
  gramsPerPlate: number | null;
  plannedGrams: number | null;
  plannedKgLabel: string | null;
};

export type AntiWasteKitchenAdvice = {
  portions: LevelPortionSuggestion[];
  totalPlannedGrams: number | null;
  totalPlannedKgLabel: string | null;
  perPlateBase: number | null;
  tip: string;
  tipTone: "info" | "watch" | "ok";
  matchedDish: string | null;
  /** Alerte matin si le plat du jour est dans le classement à risque. */
  riskyDishAlert?: {
    rank: number;
    label: string;
    avgWasteGPer100: number;
    tip: string;
  } | null;
};

export function normalizeDishLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function labelsOverlap(
  current: string[],
  past: string[],
): string | null {
  const pastSet = new Set(past.map(normalizeDishLabel).filter(Boolean));
  for (const label of current) {
    const n = normalizeDishLabel(label);
    if (n && pastSet.has(n)) return label.trim();
  }
  return null;
}

function headcountForLevel(metrics: LevelMetricInput[], level: LevelKey) {
  const rows = metrics.filter((m) => m.level === level);
  const present = rows.reduce((s, m) => s + m.presentCount, 0);
  const served = rows.reduce((s, m) => s + m.servedCount, 0);
  if (served > 0) {
    return { headcount: served, basisLabel: "servis" as const };
  }
  return { headcount: present, basisLabel: "présents" as const };
}

export function buildLevelPortionSuggestions(
  perPlateBase: number | null,
  metrics: LevelMetricInput[],
): LevelPortionSuggestion[] {
  const levels: { level: LevelKey; levelLabel: string; factor: number }[] = [
    {
      level: "MATERNELLE",
      levelLabel: "Maternelle",
      factor: MATERNELLE_PORTION_FACTOR,
    },
    {
      level: "PRIMAIRE",
      levelLabel: "Primaire",
      factor: PRIMAIRE_PORTION_FACTOR,
    },
  ];

  return levels.map(({ level, levelLabel, factor }) => {
    const { headcount, basisLabel } = headcountForLevel(metrics, level);
    const gramsPerPlate =
      perPlateBase != null && perPlateBase > 0
        ? Math.round(perPlateBase * factor)
        : null;
    const plannedGrams =
      gramsPerPlate != null && headcount > 0
        ? gramsPerPlate * headcount
        : null;
    return {
      level,
      levelLabel,
      headcount,
      basisLabel,
      gramsPerPlate,
      plannedGrams,
      plannedKgLabel:
        plannedGrams != null ? formatKgFromGrams(plannedGrams) : null,
    };
  });
}

function wastePer100(wasteWeightG: number, served: number): number | null {
  if (served <= 0 || wasteWeightG <= 0) return null;
  return (wasteWeightG / served) * 100;
}

function rabRatePct(rab: number, served: number): number | null {
  if (served <= 0) return null;
  return (rab / served) * 100;
}

/**
 * Conseil cuisine à partir du menu du jour et de l’historique
 * (même plat / libellés proches).
 */
export function buildAntiWasteKitchenAdvice(input: {
  perPlateBase: number | null;
  metrics: LevelMetricInput[];
  currentLabels: string[];
  currentMainLabels: string[];
  pastServices: PastServiceInsightInput[];
  targetGPer100: number | null;
}): AntiWasteKitchenAdvice {
  const portions = buildLevelPortionSuggestions(
    input.perPlateBase,
    input.metrics,
  );
  const totalPlannedGrams = portions.reduce(
    (s, p) => s + (p.plannedGrams ?? 0),
    0,
  );
  const hasPlanned = portions.some((p) => p.plannedGrams != null && p.plannedGrams > 0);

  const preferMains =
    input.currentMainLabels.length > 0
      ? input.currentMainLabels
      : input.currentLabels;

  const matches = input.pastServices
    .map((past) => {
      const matched =
        labelsOverlap(preferMains, past.mainLabels.length ? past.mainLabels : past.menuLabels) ??
        labelsOverlap(input.currentLabels, past.menuLabels);
      if (!matched) return null;
      return {
        past,
        matched,
        g100: wastePer100(past.wasteWeightG, past.served),
        rabPct: rabRatePct(past.rab, past.served),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m != null)
    .sort((a, b) => b.past.date.getTime() - a.past.date.getTime());

  const latest = matches[0] ?? null;
  const matchedDish = latest?.matched ?? null;

  if (!latest) {
    return {
      portions,
      totalPlannedGrams: hasPlanned ? totalPlannedGrams : null,
      totalPlannedKgLabel: hasPlanned
        ? formatKgFromGrams(totalPlannedGrams)
        : null,
      perPlateBase: input.perPlateBase,
      tip: "Pas encore d’historique pour ce menu — viser des portions plus petites en maternelle, normales en primaire, et encourager le RAB.",
      tipTone: "info",
      matchedDish: null,
    };
  }

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(latest.past.date);

  const g100 = latest.g100;
  const rabPct = latest.rabPct;
  const target = input.targetGPer100;
  const aboveTarget =
    g100 != null && target != null ? g100 > target : false;
  const highWaste = g100 != null && (aboveTarget || g100 >= 100);
  const highRab = rabPct != null && rabPct >= 25;

  if (highWaste) {
    const gPart =
      g100 != null
        ? `${g100.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} g / 100`
        : "déchets élevés";
    return {
      portions,
      totalPlannedGrams: hasPlanned ? totalPlannedGrams : null,
      totalPlannedKgLabel: hasPlanned
        ? formatKgFromGrams(totalPlannedGrams)
        : null,
      perPlateBase: input.perPlateBase,
      tip: `« ${matchedDish} » (${dateLabel}) : ${gPart} — servir plus petit, proposer le RAB plutôt que trop remplir l’assiette.`,
      tipTone: "watch",
      matchedDish,
    };
  }

  if (highRab) {
    return {
      portions,
      totalPlannedGrams: hasPlanned ? totalPlannedGrams : null,
      totalPlannedKgLabel: hasPlanned
        ? formatKgFromGrams(totalPlannedGrams)
        : null,
      perPlateBase: input.perPlateBase,
      tip: `« ${matchedDish} » (${dateLabel}) : beaucoup de RAB (${rabPct!.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %) — portions modestes dès le premier service, resservir ensuite.`,
      tipTone: "watch",
      matchedDish,
    };
  }

  if (g100 != null && (target == null || g100 <= target)) {
    return {
      portions,
      totalPlannedGrams: hasPlanned ? totalPlannedGrams : null,
      totalPlannedKgLabel: hasPlanned
        ? formatKgFromGrams(totalPlannedGrams)
        : null,
      perPlateBase: input.perPlateBase,
      tip: `« ${matchedDish} » a bien passé récemment (${dateLabel}${g100 != null ? ` · ${g100.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} g / 100` : ""}) — maintenir les portions cibles mat. / prim.`,
      tipTone: "ok",
      matchedDish,
    };
  }

  return {
    portions,
    totalPlannedGrams: hasPlanned ? totalPlannedGrams : null,
    totalPlannedKgLabel: hasPlanned
      ? formatKgFromGrams(totalPlannedGrams)
      : null,
    perPlateBase: input.perPlateBase,
    tip: `Menu proche de « ${matchedDish} » déjà servi le ${dateLabel} — adapter mat. / prim. et surveiller les déchets en fin de service.`,
    tipTone: "info",
    matchedDish,
  };
}
