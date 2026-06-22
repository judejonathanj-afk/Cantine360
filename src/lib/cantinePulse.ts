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
  wasteRate: number;
  rabRate: number;
  rows: number;
  activeDays: number;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function parseDay(d: string): Date | null {
  const x = new Date(`${d.trim()}T12:00:00`);
  return Number.isNaN(x.getTime()) ? null : x;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pctDelta(prev: number, curr: number) {
  if (prev <= 0 && curr <= 0) return 0;
  if (prev <= 0) return 100;
  return ((curr - prev) / prev) * 100;
}

function wasteRate(agg: Omit<WindowAgg, "wasteRate" | "rabRate" | "rows" | "activeDays">) {
  const denom = Math.max(1, agg.served);
  return agg.leftovers / denom;
}

function rabRate(agg: Omit<WindowAgg, "wasteRate" | "rabRate" | "rows" | "activeDays">) {
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
    wasteRate: wasteRate(base),
    rabRate: rabRate(base),
    rows: n,
    activeDays: activeDays.size,
  };
}

/** Score principal à partir du taux restes/servis (0 % → ~92, 5 % → ~52, 10 % → ~12). */
function scoreFromWasteRate(rate: number) {
  return 92 - rate * 100 * 8;
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

/** 7 derniers jours comparés aux 7 jours d’avant (restes / assiettes servies). */
export function computeCantinePulse(
  rows: CantineServiceRow[],
  mealType: string,
  opts?: { now?: Date },
): CantinePulseResult {
  const list = Array.isArray(rows) ? rows : [];
  const now = opts?.now ?? new Date();
  const tomorrow = startOfDay(new Date(now.getTime() + 86400000));
  const todayStart = startOfDay(now);
  const currentStart = new Date(todayStart.getTime() - 6 * 86400000);
  const prevEnd = currentStart;
  const prevStart = new Date(currentStart.getTime() - 7 * 86400000);

  const curr = aggregateWindow(list, mealType, currentStart, tomorrow);
  const prev = aggregateWindow(list, mealType, prevStart, prevEnd);

  const dLeftovers = pctDelta(prev.leftovers, curr.leftovers);
  const dServed = pctDelta(prev.served, curr.served);
  const dWasteRate = (curr.wasteRate - prev.wasteRate) * 100;

  const deltas = {
    wasteRatePct: dWasteRate,
    leftoversPct: dLeftovers,
    servedPct: dServed,
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
      "Dès que les présents, servis et restes sont renseignés, ce bloc se remplit tout seul.",
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
        ? "Renseignez les portions servies pour obtenir une note sur les restes."
        : "Dès que les présents, servis et restes sont renseignés, ce bloc se remplit tout seul.",
    );
  }

  const hasPreviousWeek = weeksWithServed.previous;
  const wrPct = (curr.wasteRate * 100).toFixed(1);
  const rabLine =
    curr.rab > 0
      ? ` RAB : ${curr.rab} assiette${curr.rab > 1 ? "s" : ""} (${(curr.rabRate * 100).toFixed(1)} % des servis).`
      : "";

  let score = scoreFromWasteRate(curr.wasteRate);
  if (hasPreviousWeek) {
    score += clamp(-dWasteRate * 0.4, -12, 12);
    score += clamp(-dLeftovers * 0.15, -8, 8);
  }
  score -= clamp(curr.rabRate * 100 * 0.35, 0, 10);
  score = Math.round(clamp(score, 22, 98));

  let mood: CantineMood = "ok";
  if (score >= 75) mood = "great";
  else if (score < 50) mood = "attention";

  let headline = "";
  let subline = "";
  let actionLabel = "Voir le détail";

  if (!hasPreviousWeek) {
    if (curr.wasteRate === 0) {
      headline = "Aucun reste sur la période.";
      subline = `${Math.round(curr.served)} assiettes servies sur 7 jours, 0 reste enregistré.${rabLine}`;
      actionLabel = "Voir les groupes";
    } else if (curr.wasteRate <= 0.06) {
      headline = "Peu de restes par rapport aux servis.";
      subline = `${wrPct} % de restes pour 100 assiettes servies sur 7 jours.${rabLine}`;
      actionLabel = "Voir les portions";
    } else {
      headline = "Suivi des 7 derniers jours.";
      subline = `${Math.round(curr.leftovers)} restes sur ${Math.round(curr.served)} assiettes servies (${wrPct} % pour 100).${rabLine}`;
      actionLabel = "Voir le tableau";
    }
  } else if (curr.wasteRate === 0 && curr.served > 0) {
    headline = "Aucun reste sur la période.";
    subline = `${Math.round(curr.served)} assiettes servies sur 7 jours, 0 reste enregistré.`;
    if (curr.rab > 0) {
      subline += ` RAB : ${curr.rab} (${(curr.rabRate * 100).toFixed(1)} % des servis).`;
    }
    actionLabel = "Voir les groupes";
  } else if (dLeftovers <= -12 && curr.leftovers < prev.leftovers) {
    headline = "Moins de restes qu’avant : bien joué.";
    subline = `Environ ${Math.round(Math.abs(dLeftovers))}% de restes en moins qu’il y a une semaine — taux actuel ${wrPct} % pour 100 servies.`;
    actionLabel = "Voir les groupes";
  } else if (dLeftovers >= 15 || dWasteRate >= 4) {
    headline = "Il reste plus sur les assiettes qu’avant.";
    subline = `Taux actuel ${wrPct} % pour 100 servies. Refus sur la période : ${curr.refused}.`;
    actionLabel = "Voir par jour";
  } else if (curr.wasteRate <= 0.06) {
    headline = "Peu de restes par rapport aux servis.";
    subline = `${wrPct} % de restes pour 100 assiettes servies sur 7 jours.`;
    actionLabel = "Voir les portions";
  } else {
    headline = "À peu près comme la semaine d’avant.";
    subline = `${Math.round(curr.leftovers)} restes sur 7 jours pour ${Math.round(curr.served)} assiettes servies (${wrPct} % pour 100).`;
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
  ratioPct: number | null;
};

function formatPulseDayLabel(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
  }).format(d);
}

/** Série journalière sur les 7 derniers jours (même fenêtre que `computeCantinePulse`). */
export function buildCantinePulseDailySeries(
  rows: CantineServiceRow[],
  mealType: string,
  opts?: { now?: Date },
): CantinePulseDailyPoint[] {
  const list = Array.isArray(rows) ? rows : [];
  const now = opts?.now ?? new Date();
  const tomorrow = startOfDay(new Date(now.getTime() + 86400000));
  const todayStart = startOfDay(now);
  const currentStart = new Date(todayStart.getTime() - 6 * 86400000);

  const points: CantinePulseDailyPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentStart.getTime() + i * 86400000);
    const date = formatServiceDateKey(day);
    points.push({
      date,
      label: formatPulseDayLabel(date),
      leftovers: 0,
      served: 0,
      rab: 0,
      ratioPct: null,
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

  for (const point of points) {
    point.ratioPct =
      point.served > 0
        ? Math.round((point.leftovers / point.served) * 1000) / 10
        : null;
  }

  return points;
}
