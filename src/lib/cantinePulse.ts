export type CantineMood = "great" | "ok" | "attention";

export interface CantineServiceRow {
  date: string;
  mealType: string;
  group: string;
  presentCount: number;
  servedCount: number;
  refusedCount: number;
  leftoversCount: number;
}

export interface CantinePulseResult {
  score: number;
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
  };
}

interface WindowAgg {
  leftovers: number;
  served: number;
  present: number;
  refused: number;
  wasteRate: number;
  rows: number;
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

function wasteRate(agg: Omit<WindowAgg, "wasteRate" | "rows">) {
  const denom = Math.max(1, agg.served);
  return agg.leftovers / denom;
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
  let refused = 0;
  let n = 0;
  for (const r of rows) {
    if (r.mealType !== mealType) continue;
    const day = parseDay(r.date);
    if (!day) continue;
    if (day < startInclusive || day >= endExclusive) continue;
    leftovers += Number(r.leftoversCount) || 0;
    served += Number(r.servedCount) || 0;
    present += Number(r.presentCount) || 0;
    refused += Number(r.refusedCount) || 0;
    n += 1;
  }
  const base = { leftovers, served, present, refused };
  return { ...base, wasteRate: wasteRate(base), rows: n };
}

/** 7 derniers jours comparés aux 7 jours d’avant (restes / assiettes servies). */
export function computeCantinePulse(
  rows: CantineServiceRow[],
  mealType: string,
): CantinePulseResult {
  const list = Array.isArray(rows) ? rows : [];
  const now = new Date();
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

  let score = 52;
  score += clamp(-dLeftovers * 0.35, -18, 18);
  score += clamp(-dWasteRate * 12, -16, 16);
  score += clamp(dServed * 0.08, -6, 8);

  if (curr.rows === 0 && prev.rows === 0) {
    score = 40;
  } else if (curr.served === 0 && prev.served === 0 && curr.leftovers === 0) {
    score = 42;
  }

  score = Math.round(clamp(score, 18, 98));

  let mood: CantineMood = "ok";
  if (score >= 70) mood = "great";
  else if (score < 50) mood = "attention";

  let headline = "";
  let subline = "";
  let actionLabel = "Voir le détail";

  if (curr.rows === 0) {
    headline = "Pas encore assez de saisie.";
    subline =
      "Dès que les présents, servis et restes sont renseignés sur deux semaines, ce bloc se remplit tout seul.";
    actionLabel = "Aller aux services";
  } else if (dLeftovers <= -12 && curr.leftovers < prev.leftovers) {
    headline = "Moins de restes qu’avant : bien joué.";
    subline = `Environ ${Math.round(Math.abs(dLeftovers))}% de restes en moins qu’il y a une semaine — continuez sur les quantités.`;
    actionLabel = "Voir les groupes";
  } else if (dLeftovers >= 15 || dWasteRate >= 4) {
    headline = "Il reste plus sur les assiettes qu’avant.";
    subline = `Plus de restes ou plus de restes par rapport aux portions servies. Refus enregistrés sur la période : ${curr.refused}.`;
    actionLabel = "Voir par jour";
  } else if (curr.wasteRate <= 0.06 && curr.served > 30) {
    headline = "Peu de restes par rapport aux servis.";
    subline =
      "Pour cette semaine, les restes restent raisonnables par rapport aux assiettes servies.";
    actionLabel = "Voir les portions";
  } else {
    headline = "À peu près comme la semaine d’avant.";
    subline = `${Math.round(curr.leftovers)} restes sur 7 jours pour ${Math.round(curr.served)} assiettes servies.`;
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
      deltas: {
        wasteRatePct: dWasteRate,
        leftoversPct: dLeftovers,
        servedPct: dServed,
      },
    },
  };
}
