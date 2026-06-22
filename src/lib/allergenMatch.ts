import { EU14_ALLERGENS, type AllergenLabel } from "@/lib/allergens";

const ALLERGEN_ALIASES: Record<string, AllergenLabel> = {
  gluten: "Céréales contenant du gluten",
  cereales: "Céréales contenant du gluten",
  "cereales contenant du gluten": "Céréales contenant du gluten",
  crustaces: "Crustacés",
  oeufs: "Œufs",
  oeuf: "Œufs",
  poissons: "Poissons",
  poisson: "Poissons",
  arachides: "Arachides",
  cacahuete: "Arachides",
  cacahuetes: "Arachides",
  soja: "Soja",
  lait: "Lait",
  "fruits a coque": "Fruits à coque",
  "fruit a coque": "Fruits à coque",
  noix: "Fruits à coque",
  celeri: "Céleri",
  moutarde: "Moutarde",
  sesame: "Graines de sésame",
  "graines de sesame": "Graines de sésame",
  sulfites: "Anhydride sulfureux et sulfites",
  "anhydride sulfureux": "Anhydride sulfureux et sulfites",
  lupin: "Lupin",
  mollusques: "Mollusques",
  moule: "Mollusques",
  moules: "Mollusques",
};

function normalizeToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Convertit un libellé CSV (ex. « Lait, Gluten ») en allergènes EU-14 canoniques. */
export function parseAllergenTokens(raw: string): AllergenLabel[] {
  if (!raw.trim()) return [];
  const parts = raw.split(/[,;|/]/).map((p) => p.trim()).filter(Boolean);
  const out = new Set<AllergenLabel>();

  for (const part of parts) {
    const norm = normalizeToken(part);
    if (ALLERGEN_ALIASES[norm]) {
      out.add(ALLERGEN_ALIASES[norm]);
      continue;
    }
    const exact = EU14_ALLERGENS.find((a) => normalizeToken(a) === norm);
    if (exact) {
      out.add(exact);
      continue;
    }
    const partial = EU14_ALLERGENS.find(
      (a) => normalizeToken(a).includes(norm) || norm.includes(normalizeToken(a)),
    );
    if (partial) out.add(partial);
  }

  return [...out];
}

export function allergensIntersect(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

export function studentAffectedByMenu(
  studentAllergens: string[],
  menuItemAllergens: string[][],
): boolean {
  if (studentAllergens.length === 0) return false;
  for (const dish of menuItemAllergens) {
    if (allergensIntersect(studentAllergens, dish).length > 0) return true;
  }
  return false;
}

export function dishesAffectingStudent(
  studentAllergens: string[],
  items: Array<{ label: string; allergens: string[] }>,
): string[] {
  if (studentAllergens.length === 0) return [];
  return items
    .filter((item) => allergensIntersect(studentAllergens, item.allergens).length > 0)
    .map((item) => item.label);
}

export function countStudentsAffectedByDish(
  students: Array<{ allergens: string[] }>,
  dishAllergens: string[],
): number {
  if (dishAllergens.length === 0) return 0;
  return students.filter(
    (s) => s.allergens.length > 0 && allergensIntersect(s.allergens, dishAllergens).length > 0,
  ).length;
}
