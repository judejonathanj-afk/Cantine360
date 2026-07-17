export type SchoolLevel = "MATERNELLE" | "PRIMAIRE";

export const SCHOOL_LEVELS: SchoolLevel[] = ["MATERNELLE", "PRIMAIRE"];

export function schoolLevelLabelFr(level: SchoolLevel): string {
  return level === "MATERNELLE" ? "Maternelle" : "Primaire";
}

/** Parse CSV / form values into SchoolLevel ; null if empty/unknown. */
export function parseSchoolLevel(raw: string | null | undefined): SchoolLevel | null {
  const v = (raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!v) return null;
  if (v === "maternelle" || v === "mat" || v === "m") return "MATERNELLE";
  if (v === "primaire" || v === "prim" || v === "p" || v === "elem" || v === "elementaire") {
    return "PRIMAIRE";
  }
  return null;
}
