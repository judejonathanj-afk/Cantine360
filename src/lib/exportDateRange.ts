/** Plafond exports CSV services/menus (évite OOM serverless sur « depuis 2020 »). */
export const MAX_EXPORT_RANGE_DAYS = 400;

export function parseLocalDateStart(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export type ExportDateRange =
  | {
      ok: true;
      from: Date;
      toExclusive: Date;
      fromStr: string;
      toStr: string;
      dayCount: number;
    }
  | { ok: false; error: string };

/**
 * Valide from/to inclusifs (YYYY-MM-DD) et refuse les plages trop longues.
 */
export function resolveExportDateRange(fromStr: string, toStr: string): ExportDateRange {
  const from = parseLocalDateStart(fromStr);
  const to = parseLocalDateStart(toStr);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { ok: false, error: "Dates invalides." };
  }
  if (from.getTime() > to.getTime()) {
    return { ok: false, error: "La date de début doit précéder la date de fin." };
  }
  const toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000);
  const dayCount = Math.round(
    (toExclusive.getTime() - from.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (dayCount > MAX_EXPORT_RANGE_DAYS) {
    return {
      ok: false,
      error: `Période trop longue (max ${MAX_EXPORT_RANGE_DAYS} jours). Choisissez une plage plus courte.`,
    };
  }
  return { ok: true, from, toExclusive, fromStr, toStr, dayCount };
}
