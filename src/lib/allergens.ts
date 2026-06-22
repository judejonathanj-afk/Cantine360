export const EU14_ALLERGENS = [
  "Céréales contenant du gluten",
  "Crustacés",
  "Œufs",
  "Poissons",
  "Arachides",
  "Soja",
  "Lait",
  "Fruits à coque",
  "Céleri",
  "Moutarde",
  "Graines de sésame",
  "Anhydride sulfureux et sulfites",
  "Lupin",
  "Mollusques",
] as const;

export type AllergenLabel = (typeof EU14_ALLERGENS)[number];

/** Libellé court affiché en cuisine (le stockage reste le libellé EU-14 complet). */
export const ALLERGEN_SHORT_LABELS: Partial<Record<AllergenLabel, string>> = {
  "Céréales contenant du gluten": "Gluten",
  "Anhydride sulfureux et sulfites": "Sulfites",
  "Graines de sésame": "Sésame",
};

export function allergenButtonLabel(allergen: AllergenLabel): string {
  return ALLERGEN_SHORT_LABELS[allergen] ?? allergen;
}
