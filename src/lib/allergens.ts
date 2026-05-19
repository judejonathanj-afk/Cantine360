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

