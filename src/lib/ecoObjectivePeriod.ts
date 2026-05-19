import { startOfISOWeek } from "date-fns";
import type { EcoObjectivePeriod } from "@/generated/prisma/client";
import { ytdDateBounds } from "@/lib/commissionBilan";

export type EcoBounds = {
  currentStart: Date;
  currentEndExclusive: Date;
  priorStart: Date;
  priorEndExclusive: Date;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Début du jour suivant `d` (heure locale), exclusif fin de période courante. */
function tomorrowExclusiveFrom(d: Date) {
  const x = startOfDay(d);
  x.setDate(x.getDate() + 1);
  return x;
}

function startOfCalendarQuarter(d: Date) {
  const m = d.getMonth();
  const q0 = Math.floor(m / 3) * 3;
  return new Date(d.getFullYear(), q0, 1, 0, 0, 0, 0);
}

/** Début de l’année scolaire qui contient la date `d` (ex. rentrée le 1er sept.). */
export function schoolYearStart(
  d: Date,
  startMonth: number,
  startDay: number,
): Date {
  const y = d.getFullYear();
  let start = new Date(y, startMonth - 1, startDay, 0, 0, 0, 0);
  if (d.getTime() < start.getTime()) {
    start = new Date(y - 1, startMonth - 1, startDay, 0, 0, 0, 0);
  }
  return start;
}

export function ecoObjectiveBounds(
  now: Date,
  kind: EcoObjectivePeriod,
  schoolYearStartMonth: number,
  schoolYearStartDay: number,
): EcoBounds {
  const currentEndExclusive = tomorrowExclusiveFrom(now);

  if (kind === "CALENDAR_YEAR") {
    const y = ytdDateBounds(now);
    return {
      currentStart: y.ytdStart,
      currentEndExclusive: y.ytdEndExclusive,
      priorStart: y.priorYtdStart,
      priorEndExclusive: y.priorYtdEndExclusive,
    };
  }

  if (kind === "ISO_WEEK") {
    const currentStart = startOfISOWeek(now);
    const priorEndExclusive = currentStart;
    const priorStart = new Date(currentStart);
    priorStart.setDate(priorStart.getDate() - 7);
    return { currentStart, currentEndExclusive, priorStart, priorEndExclusive };
  }

  if (kind === "CALENDAR_QUARTER") {
    const currentStart = startOfCalendarQuarter(now);
    const span = currentEndExclusive.getTime() - currentStart.getTime();
    const priorEndExclusive = currentStart;
    const priorStart = new Date(priorEndExclusive.getTime() - span);
    return { currentStart, currentEndExclusive, priorStart, priorEndExclusive };
  }

  /* SCHOOL_YEAR */
  const currentStart = schoolYearStart(now, schoolYearStartMonth, schoolYearStartDay);
  const span = currentEndExclusive.getTime() - currentStart.getTime();
  const priorStart = new Date(currentStart);
  priorStart.setFullYear(priorStart.getFullYear() - 1);
  const priorEndExclusive = new Date(priorStart.getTime() + span);
  return { currentStart, currentEndExclusive, priorStart, priorEndExclusive };
}

const MOIS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function ecoPeriodTitleFr(
  kind: EcoObjectivePeriod,
  schoolYearStartMonth: number,
  schoolYearStartDay: number,
): string {
  if (kind === "ISO_WEEK") {
    return "Objectifs — semaine en cours (vs semaine d’avant)";
  }
  if (kind === "CALENDAR_QUARTER") {
    return "Objectifs — trimestre en cours (vs trimestre d’avant)";
  }
  if (kind === "SCHOOL_YEAR") {
    const m = MOIS_FR[schoolYearStartMonth - 1] ?? "septembre";
    return `Objectifs — année scolaire (depuis le ${schoolYearStartDay} ${m})`;
  }
  return "Objectifs — année civile (depuis le 1er janvier)";
}

export function ecoRestesParenFr(kind: EcoObjectivePeriod): string {
  if (kind === "ISO_WEEK") return "(lundi → aujourd’hui)";
  if (kind === "CALENDAR_QUARTER") return "(depuis le début du trimestre)";
  if (kind === "SCHOOL_YEAR") return "(depuis la rentrée)";
  return "(depuis le 1er janvier)";
}

export function ecoPriorPhraseFr(kind: EcoObjectivePeriod): string {
  if (kind === "ISO_WEEK") return "vs la semaine précédente";
  if (kind === "CALENDAR_QUARTER") return "vs le trimestre précédent (même durée)";
  return "vs la même période l’an dernier";
}
