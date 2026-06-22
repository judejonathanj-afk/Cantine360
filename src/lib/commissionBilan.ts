import type { MealType } from "@/generated/prisma/client";

export type ServiceWithMetrics = {
  date: Date;
  mealType: MealType;
  metrics: Array<{
    presentCount: number;
    servedCount: number;
    rabCount: number;
    refusedCount: number;
    leftoversCount: number;
  }>;
};

export function ytdDateBounds(now: Date) {
  const year = now.getFullYear();
  const ytdStart = new Date(year, 0, 1);
  ytdStart.setHours(0, 0, 0, 0);
  const ytdEndExclusive = new Date(now);
  ytdEndExclusive.setDate(ytdEndExclusive.getDate() + 1);
  ytdEndExclusive.setHours(0, 0, 0, 0);

  const anchorLastYear = new Date(now);
  anchorLastYear.setFullYear(anchorLastYear.getFullYear() - 1);

  const priorYtdStart = new Date(year - 1, 0, 1);
  priorYtdStart.setHours(0, 0, 0, 0);
  const priorYtdEndExclusive = new Date(anchorLastYear);
  priorYtdEndExclusive.setDate(priorYtdEndExclusive.getDate() + 1);
  priorYtdEndExclusive.setHours(0, 0, 0, 0);

  return { ytdStart, ytdEndExclusive, priorYtdStart, priorYtdEndExclusive };
}

export function sumServiceMetrics(
  services: ServiceWithMetrics[],
  opts: {
    mealType?: MealType;
    fromInclusive: Date;
    toExclusive: Date;
  },
) {
  const t0 = opts.fromInclusive.getTime();
  const t1 = opts.toExclusive.getTime();
  let present = 0;
  let served = 0;
  let rab = 0;
  let refused = 0;
  let leftovers = 0;
  for (const s of services) {
    const t = s.date.getTime();
    if (t < t0 || t >= t1) continue;
    if (opts.mealType && s.mealType !== opts.mealType) continue;
    for (const m of s.metrics) {
      present += m.presentCount;
      served += m.servedCount;
      rab += m.rabCount;
      refused += m.refusedCount;
      leftovers += m.leftoversCount;
    }
  }
  return { present, served, rab, refused, leftovers };
}

export function monthRange(year: number, monthIndex0: number) {
  const fromInclusive = new Date(year, monthIndex0, 1);
  fromInclusive.setHours(0, 0, 0, 0);
  const toExclusive = new Date(year, monthIndex0 + 1, 1);
  toExclusive.setHours(0, 0, 0, 0);
  return { fromInclusive, toExclusive };
}

export function ratioRestesServisPct(leftovers: number, served: number) {
  if (served <= 0) return null;
  return (leftovers / served) * 100;
}

export function ratioRabServisPct(rab: number, served: number) {
  if (served <= 0) return null;
  return (rab / served) * 100;
}

export function leftoversReductionVsPriorPct(
  currentLeftovers: number,
  priorLeftovers: number,
) {
  if (priorLeftovers <= 0) return null;
  return ((priorLeftovers - currentLeftovers) / priorLeftovers) * 100;
}

export type ServiceWithPerGroupMetrics = {
  date: Date;
  mealType: MealType;
  metrics: Array<{
    groupId: string;
    presentCount: number;
    servedCount: number;
    rabCount: number;
    refusedCount: number;
    leftoversCount: number;
  }>;
};

/** Somme les métriques d’un seul groupe sur une fenêtre de dates (pour objectifs par classe). */
export function sumServiceMetricsForGroup(
  services: ServiceWithPerGroupMetrics[],
  opts: {
    mealType: MealType;
    groupId: string;
    fromInclusive: Date;
    toExclusive: Date;
  },
) {
  const t0 = opts.fromInclusive.getTime();
  const t1 = opts.toExclusive.getTime();
  let present = 0;
  let served = 0;
  let rab = 0;
  let refused = 0;
  let leftovers = 0;
  for (const s of services) {
    const t = s.date.getTime();
    if (t < t0 || t >= t1) continue;
    if (s.mealType !== opts.mealType) continue;
    for (const m of s.metrics) {
      if (m.groupId !== opts.groupId) continue;
      present += m.presentCount;
      served += m.servedCount;
      rab += m.rabCount;
      refused += m.refusedCount;
      leftovers += m.leftoversCount;
    }
  }
  return { present, served, rab, refused, leftovers };
}
