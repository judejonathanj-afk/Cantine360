export const SERVICE_DATE_TIMEZONE = "Europe/Paris";

/** Jour calendaire YYYY-MM-DD (fuseau établissement, Paris par défaut). */
export function formatServiceDateKey(
  date: Date,
  timeZone: string = SERVICE_DATE_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}
