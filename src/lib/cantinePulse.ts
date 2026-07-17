import { formatServiceDateKey } from "@/lib/serviceDate";

export type CantineMood = "great" | "ok" | "attention" | "pending";

export interface CantineServiceRow {
  date: string;
  mealType: string;
  group: string;
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
  leftoversCount: number;
}

export type CantineWasteDayRow = {
  date: string;
  mealType: string;
  wasteWeightG: number;
};

export interface CantinePulseResult {
  /** Null tant qu’il n’y a pas de portions servies sur la période. */
  score: number | null;
  mood: CantineMood;
  headline: string;
  subline: string;
  actionLabel: string;
  meta: {
    mealType: string;
    curr: WindowAgg;
    prev: WindowAgg;
    deltas: {
      wasteRatePct: number;
      leftoversPct: number;
      servedPct: number;
      wasteGramsPct: number;
    };
    /** Semaines avec des portions servies (courante / précédente). */
    weeksWithServed: { current: boolean; previous: boolean };
  };
}

interface WindowAgg {
  leftovers: number;
  served: number;
  present: number;
  rab: number;
  refused: number;
  wasteWeightG: number;
  wasteGramsPer100Served: number;
  servicesWithWaste: number;
  wasteRate: number;
  rabRate: number;
  rows: number;
  activeDays: number;
}

export type CantinePulseWindowDays = 7 | 30;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Début du jour calendaire (Paris) pour ancrer les fenêtres 7j / 30j. */
function calendarDayStart(now: Date) {
  const key = formatServiceDateKey(now);
  return parseDay(key) ?? startOfDay(now);
}

function windowBounds(now: Date, windowDays: CantinePulseWindowDays) {
  const todayStart = calendarDayStart(now);
  const tomorrow = new Date(todayStart.getTime() + 86400000);
  const currentStart = new Date(todayStart.getTime() - (windowDays - 1) * 86400000);
  const prevEnd = currentStart;
  const prevStart = new Date(currentStart.getTime() - windowDays * 86400000);
  return { tomorrow, currentStart, prevStart, prevEnd };
}

/** Clés YYYY-MM-DD (Paris) pour une fenêtre [début, fin[. */
function windowDateKeys(startInclusive: Date, endExclusive: Date): Set<string> {
  const keys = new Set<string>();
  for (let t = startInclusive.getTime(); t < endExclusive.getTime(); t += 86400000) {
    keys.add(formatServiceDateKey(new Date(t)));
  }
  return keys;
}

function periodLabelFr(windowDays: CantinePulseWindowDays) {
  return windowDays === 30 ? "30 jours" : "7 jours";
}

function priorPeriodPhraseFr(windowDays: CantinePulseWindowDays) {
  return windowDays === 30 ? "les 30 jours d’avant" : "la semaine d’avant";
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function parseDay(d: string): Date | null {
  const x = new Date(`${d.trim()}T12:00:00`);
  return Number.isNaN(x.getTime()) ? null : x;
}

function pctDelta(prev: number, curr: number) {
  if (prev <= 0 && curr <= 0) return 0;
  if (prev <= 0) return 100;
  return ((curr - prev) / prev) * 100;
}

function wasteRate(agg: { leftovers: number; served: number }) {
  const denom = Math.max(1, agg.served);
  return agg.leftovers / denom;
}

function rabRate(agg: { rab: number; served: number }) {
  const denom = Math.max(1, agg.served);
  return agg.rab / denom;
}

function aggregateWindow(
  rows: CantineServiceRow[],
  mealType: string,
  startInclusive: Date,
  endExclusive: Date,
): WindowAgg {
  let leftovers = 0;
  let served = 0;
  let present = 0;
  let rab = 0;
  let refused = 0;
  let n = 0;
  const activeDays = new Set<string>();

  for (const r of rows) {
    if (r.mealType !== mealType) continue;
    const day = parseDay(r.date);
    if (!day) continue;
    if (day < startInclusive || day >= endExclusive) continue;
    leftovers += Number(r.leftoversCount) || 0;
    served += Number(r.servedCount) || 0;
    present += Number(r.presentCount) || 0;
    rab += Number(r.rabCount) || 0;
    refused += Number(r.refusedCount) || 0;
    n += 1;
    if ((Number(r.servedCount) || 0) > 0 || (Number(r.presentCount) || 0) > 0) {
      activeDays.add(r.date);
    }
  }
  const base = { leftovers, served, present, rab, refused };
  return {
    ...base,
    wasteWeightG: 0,
    wasteGramsPer100Served: 0,
    servicesWithWaste: 0,
    wasteRate: wasteRate(base),
    rabRate: rabRate(base),
    rows: n,
    activeDays: activeDays.size,
  };
}

function aggregateWasteWindow(
  wasteRows: CantineWasteDayRow[],
  mealType: string,
  dateKeys: Set<string>,
) {
  let wasteWeightG = 0;
  let servicesWithWaste = 0;

  for (const r of wasteRows) {
    if (String(r.mealType) !== mealType) continue;
    if (!dateKeys.has(r.date)) continue;
    if (r.wasteWeightG <= 0) continue;
    wasteWeightG += r.wasteWeightG;
    servicesWithWaste += 1;
  }

  return { wasteWeightG, servicesWithWaste };
}

function withWasteMetrics(
  agg: WindowAgg,
  waste: { wasteWeightG: number; servicesWithWaste: number },
): WindowAgg {
  const wasteGramsPer100Served =
    agg.served > 0 ? (waste.wasteWeightG / agg.served) * 100 : 0;
  return {
    ...agg,
    wasteWeightG: waste.wasteWeightG,
    servicesWithWaste: waste.servicesWithWaste,
    wasteGramsPer100Served,
  };
}

/** Score principal à partir des g déchets / 100 assiettes (0 → ~92, 2000 → ~72, 5000 → ~42). */
function scoreFromWasteGramsPer100(gPer100: number) {
  return 92 - gPer100 * 0.01;
}

function pendingResult(
  mealType: string,
  curr: WindowAgg,
  prev: WindowAgg,
  deltas: CantinePulseResult["meta"]["deltas"],
  headline: string,
  subline: string,
  actionLabel = "Aller aux services",
): CantinePulseResult {
  return {
    score: null,
    mood: "pending",
    headline,
    subline,
    actionLabel,
    meta: {
      mealType,
      curr,
      prev,
      deltas,
      weeksWithServed: {
        current: curr.served > 0,
        previous: prev.served > 0,
      },
    },
  };
}

/** Fenêtre glissante comparée à la période précédente (7 ou 30 jours). */
export function computeCantinePulse(
  rows: CantineServiceRow[],
  mealType: string,
  opts?: {
    now?: Date;
    windowDays?: CantinePulseWindowDays;
    wasteRows?: CantineWasteDayRow[];
  },
): CantinePulseResult {
  const list = Array.isArray(rows) ? rows : [];
  const wasteList = Array.isArray(opts?.wasteRows) ? opts.wasteRows : [];
  const now = opts?.now ?? new Date();
  const windowDays = opts?.windowDays ?? 7;
  const { tomorrow, currentStart, prevStart, prevEnd } = windowBounds(now, windowDays);
  const period = periodLabelFr(windowDays);
  const priorPhrase = priorPeriodPhraseFr(windowDays);
  const currDateKeys = windowDateKeys(currentStart, tomorrow);
  const prevDateKeys = windowDateKeys(prevStart, prevEnd);

  const curr = withWasteMetrics(
    aggregateWindow(list, mealType, currentStart, tomorrow),
    aggregateWasteWindow(wasteList, mealType, currDateKeys),
  );
  const prev = withWasteMetrics(
    aggregateWindow(list, mealType, prevStart, prevEnd),
    aggregateWasteWindow(wasteList, mealType, prevDateKeys),
  );

  const dLeftovers = pctDelta(prev.leftovers, curr.leftovers);
  const dServed = pctDelta(prev.served, curr.served);
  const dWasteRate = (curr.wasteRate - prev.wasteRate) * 100;
  const dWasteGrams = pctDelta(prev.wasteWeightG, curr.wasteWeightG);

  const deltas = {
    wasteRatePct: dWasteRate,
    leftoversPct: dLeftovers,
    servedPct: dServed,
    wasteGramsPct: dWasteGrams,
  };

  const weeksWithServed = {
    current: curr.served > 0,
    previous: prev.served > 0,
  };

  if (curr.rows === 0 && prev.rows === 0) {
    return pendingResult(
      mealType,
      curr,
      prev,
      deltas,
      "Pas encore assez de saisie.",
      "Dès que les présents, servis et le poids des déchets sont renseignés, ce bloc se remplit tout seul.",
    );
  }

  if (!weeksWithServed.current) {
    return pendingResult(
      mealType,
      curr,
      prev,
      deltas,
      "Pas encore assez de saisie.",
      curr.rows > 0
        ? "Renseignez les portions servies pour obtenir une note sur les déchets."
        : "Dès que les présents, servis et le poids des déchets sont renseignés, ce bloc se remplit tout seul.",
    );
  }

  const hasPreviousWeek = weeksWithServed.previous;
  const rabLine =
    curr.rab > 0
      ? ` RAB : ${curr.rab} assiette${curr.rab > 1 ? "s" : ""} (${(curr.rabRate * 100).toFixed(1)} % des servis).`
      : "";
  const wasteLine =
    curr.wasteWeightG > 0
      ? ` Déchets : ${Math.round(curr.wasteWeightG).toLocaleString("fr-FR")} g${
          curr.served > 0
            ? ` (${curr.wasteGramsPer100Served.toFixed(1)} g / 100 assiettes).`
            : "."
        }`
      : "";
  const gPer100 = curr.wasteGramsPer100Served;

  let score = scoreFromWasteGramsPer100(gPer100);
  if (curr.wasteWeightG <= 0) {
    // Sans poids déchets : note neutre basée sur le RAB uniquement
    score = 78 - clamp(curr.rabRate * 100 * 0.5, 0, 15);
  }
  if (hasPreviousWeek) {
    score += clamp(-dWasteGrams * 0.15, -12, 12);
  }
  score -= clamp(curr.rabRate * 100 * 0.35, 0, 10);
  if (hasPreviousWeek && prev.wasteWeightG > 0 && dWasteGrams > 10) {
    score -= clamp(dWasteGrams * 0.04, 0, 6);
  }
  score = Math.round(clamp(score, 22, 98));

  let mood: CantineMood = "ok";
  if (score >= 75) mood = "great";
  else if (score < 50) mood = "attention";

  let headline = "";
  let subline = "";
  let actionLabel = "Voir le détail";

  if (curr.wasteWeightG <= 0) {
    headline = "Poids des déchets à saisir.";
    subline = `${Math.round(curr.served)} assiettes servies sur ${period}.${rabLine} Renseignez le poids des déchets en fin de service.`;
    actionLabel = "Aller au service";
  } else if (!hasPreviousWeek) {
    if (gPer100 <= 1500) {
      headline = "Peu de déchets pour 100 assiettes.";
      subline = `${gPer100.toFixed(1)} g / 100 assiettes servies sur ${period}.${rabLine}`;
      actionLabel = "Voir les portions";
    } else {
      headline = `Suivi des ${period}.`;
      subline = `${Math.round(curr.wasteWeightG).toLocaleString("fr-FR")} g de déchets pour ${Math.round(curr.served)} assiettes (${gPer100.toFixed(1)} g / 100).${rabLine}`;
      actionLabel = "Voir le tableau";
    }
  } else if (dWasteGrams <= -12 && curr.wasteWeightG < prev.wasteWeightG) {
    headline = "Moins de déchets qu’avant : bien joué.";
    subline = `Environ ${Math.round(Math.abs(dWasteGrams))} % de déchets en moins qu’${priorPhrase} — ${gPer100.toFixed(1)} g / 100 assiettes.${rabLine}`;
    actionLabel = "Voir les groupes";
  } else if (dWasteGrams >= 15) {
    headline = "Plus de déchets qu’avant.";
    subline = `Taux actuel ${gPer100.toFixed(1)} g / 100 assiettes. Refus sur la période : ${curr.refused}.${rabLine}`;
    actionLabel = "Voir par jour";
  } else if (gPer100 <= 1500) {
    headline = "Peu de déchets pour 100 assiettes.";
    subline = `${gPer100.toFixed(1)} g / 100 assiettes servies sur ${period}.${rabLine}`;
    actionLabel = "Voir les portions";
  } else {
    headline =
      windowDays === 30
        ? "À peu près comme la période d’avant."
        : "À peu près comme la semaine d’avant.";
    subline = `${Math.round(curr.wasteWeightG).toLocaleString("fr-FR")} g de déchets sur ${period} pour ${Math.round(curr.served)} assiettes (${gPer100.toFixed(1)} g / 100).${rabLine}`;
    actionLabel = "Voir le tableau";
  }

  return {
    score,
    mood,
    headline,
    subline,
    actionLabel,
    meta: {
      mealType,
      curr,
      prev,
      deltas,
      weeksWithServed,
    },
  };
}

export type CantinePulseDailyPoint = {
  date: string;
  label: string;
  leftovers: number;
  served: number;
  rab: number;
  wasteWeightG: number;
  ratioPct: number | null;
  /** Grammes de déchets pour 100 assiettes servies ce jour-là. */
  gramsPer100Waste: number | null;
};

function formatPulseDayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
  }).format(d);
}

/** Série journalière sur la fenêtre courante (même durée que `computeCantinePulse`). */
export function buildCantinePulseDailySeries(
  rows: CantineServiceRow[],
  mealType: string,
  opts?: {
    now?: Date;
    windowDays?: CantinePulseWindowDays;
    wasteRows?: CantineWasteDayRow[];
  },
): CantinePulseDailyPoint[] {
  const list = Array.isArray(rows) ? rows : [];
  const wasteList = Array.isArray(opts?.wasteRows) ? opts.wasteRows : [];
  const now = opts?.now ?? new Date();
  const windowDays = opts?.windowDays ?? 7;
  const { tomorrow, currentStart } = windowBounds(now, windowDays);

  const points: CantinePulseDailyPoint[] = [];
  for (let i = 0; i < windowDays; i++) {
    const day = new Date(currentStart.getTime() + i * 86400000);
    const date = formatServiceDateKey(day);
    points.push({
      date,
      label: formatPulseDayLabel(date),
      leftovers: 0,
      served: 0,
      rab: 0,
      wasteWeightG: 0,
      ratioPct: null,
      gramsPer100Waste: null,
    });
  }

  const byDate = new Map(points.map((p) => [p.date, p]));

  for (const r of list) {
    if (r.mealType !== mealType) continue;
    const day = parseDay(r.date);
    if (!day || day < currentStart || day >= tomorrow) continue;
    const point = byDate.get(r.date);
    if (!point) continue;
    point.leftovers += Number(r.leftoversCount) || 0;
    point.served += Number(r.servedCount) || 0;
    point.rab += Number(r.rabCount) || 0;
  }

  for (const r of wasteList) {
    if (String(r.mealType) !== mealType) continue;
    const point = byDate.get(r.date);
    if (!point) continue;
    point.wasteWeightG += Number(r.wasteWeightG) || 0;
  }

  for (const point of points) {
    point.ratioPct =
      point.served > 0
        ? Math.round((point.leftovers / point.served) * 1000) / 10
        : null;
    point.gramsPer100Waste =
      point.served > 0 && point.wasteWeightG > 0
        ? Math.round((point.wasteWeightG / point.served) * 100 * 10) / 10
        : null;
  }

  return points;
}
