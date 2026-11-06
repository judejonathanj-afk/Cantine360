/** Régimes alimentaires (hors allergènes UE-14 : gluten, lait, etc.). */

export const DIET_KEYS = [
  "noPork",
  "vegetarian",
  "vegan",
  "pescetarian",
  "noBeef",
  "halal",
  "kosher",
] as const;

export type DietKey = (typeof DIET_KEYS)[number];

export type StudentDiets = Record<DietKey, boolean>;

export type MenuDietFlags = {
  containsPork: boolean;
  containsMeat: boolean;
  containsBeef?: boolean;
  containsFish?: boolean;
};

export const DIET_META: Record<
  DietKey,
  {
    label: string;
    labelPlural: string;
    csvHeaders: string[];
    chipClass: string;
    kitchenHint: string;
  }
> = {
  noPork: {
    label: "Sans porc",
    labelPlural: "sans porc",
    csvHeaders: ["sans_porc", "sansporc", "sans porc", "sans-porc", "no_pork", "nopork"],
    chipClass: "bg-sky-800 text-white",
    kitchenHint: "Ne pas servir (porc). Prévoir une alternative sans porc.",
  },
  vegetarian: {
    label: "Végétarien",
    labelPlural: "végétariens",
    csvHeaders: ["vegetarien", "vegetarian", "vege", "veggie"],
    chipClass: "bg-emerald-800 text-white",
    kitchenHint: "Ne pas servir (viande). Prévoir une alternative végétarienne.",
  },
  vegan: {
    label: "Végétalien",
    labelPlural: "végétaliens",
    csvHeaders: ["vegetalien", "vegan", "végétalien", "vegetalienne"],
    chipClass: "bg-lime-800 text-white",
    kitchenHint:
      "Ne pas servir (viande, poisson). Vérifier aussi œufs, lait et autres produits animaux.",
  },
  pescetarian: {
    label: "Pescétarien",
    labelPlural: "pescétariens",
    csvHeaders: ["pescetarien", "pescetarian", "pesco"],
    chipClass: "bg-cyan-800 text-white",
    kitchenHint: "Ne pas servir (viande). Le poisson est possible.",
  },
  noBeef: {
    label: "Sans bœuf",
    labelPlural: "sans bœuf",
    csvHeaders: ["sans_boeuf", "sans_boef", "sans boeuf", "sans bœuf", "no_beef", "nobeef"],
    chipClass: "bg-orange-800 text-white",
    kitchenHint: "Ne pas servir (bœuf).",
  },
  halal: {
    label: "Halal",
    labelPlural: "halal",
    csvHeaders: ["halal"],
    chipClass: "bg-teal-800 text-white",
    kitchenHint:
      "Ne pas servir (porc). La viande du jour n’est pas certifiée halal — adapter si besoin.",
  },
  kosher: {
    label: "Casher",
    labelPlural: "casher",
    csvHeaders: ["casher", "cacher", "kosher", "kasher"],
    chipClass: "bg-indigo-800 text-white",
    kitchenHint: "Ne pas servir (porc). Adapter selon les consignes casher.",
  },
};

export function emptyStudentDiets(): StudentDiets {
  return {
    noPork: false,
    vegetarian: false,
    vegan: false,
    pescetarian: false,
    noBeef: false,
    halal: false,
    kosher: false,
  };
}

export function pickStudentDiets(
  source: Partial<StudentDiets> | Record<string, unknown>,
): StudentDiets {
  const next = emptyStudentDiets();
  for (const key of DIET_KEYS) {
    next[key] = Boolean(source[key]);
  }
  return next;
}

export function studentHasAnyDiet(source: Partial<StudentDiets>): boolean {
  return DIET_KEYS.some((key) => source[key]);
}

export function activeDietKeys(source: Partial<StudentDiets>): DietKey[] {
  return DIET_KEYS.filter((key) => source[key]);
}

export function parseOuiNon(raw: string): boolean {
  const v = raw.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return ["oui", "o", "yes", "y", "1", "true", "x"].includes(v);
}

function meatLike(dish: MenuDietFlags): boolean {
  return Boolean(dish.containsMeat || dish.containsPork || dish.containsBeef);
}

export function dishConflictsDiet(diet: DietKey, dish: MenuDietFlags): boolean {
  const pork = Boolean(dish.containsPork);
  const beef = Boolean(dish.containsBeef);
  const fish = Boolean(dish.containsFish);
  const meat = meatLike(dish);
  switch (diet) {
    case "noPork":
    case "halal":
    case "kosher":
      return pork;
    case "vegetarian":
      return meat || pork;
    case "vegan":
      return meat || pork || fish;
    case "pescetarian":
      return meat || pork;
    case "noBeef":
      return beef;
  }
}

export function dietConflictsWithMenu(
  student: Partial<StudentDiets>,
  dishes: Array<MenuDietFlags & { label: string }>,
): {
  noPorkDishes: string[];
  vegetarianDishes: string[];
  dishes: string[];
  byDiet: Partial<Record<DietKey, string[]>>;
} {
  const byDiet: Partial<Record<DietKey, string[]>> = {};
  for (const key of DIET_KEYS) {
    if (!student[key]) continue;
    const labels = dishes.filter((d) => dishConflictsDiet(key, d)).map((d) => d.label);
    if (labels.length > 0) byDiet[key] = labels;
  }
  const dishesAll = [...new Set(Object.values(byDiet).flat())];
  return {
    byDiet,
    dishes: dishesAll,
    noPorkDishes: byDiet.noPork ?? [],
    vegetarianDishes: byDiet.vegetarian ?? [],
  };
}

export function countDietForDish(
  students: Array<Partial<StudentDiets>>,
  dish: MenuDietFlags,
): Record<DietKey, number> {
  const counts = Object.fromEntries(DIET_KEYS.map((key) => [key, 0])) as Record<
    DietKey,
    number
  >;
  for (const s of students) {
    for (const key of DIET_KEYS) {
      if (s[key] && dishConflictsDiet(key, dish)) counts[key] += 1;
    }
  }
  return counts;
}

/** Ajoute les flags régimes sans casser le client Prisma avant `prisma generate`. */
export function withDietFlags<T extends object>(
  data: T,
  flags: Record<string, boolean>,
): T {
  return { ...data, ...flags } as T;
}

export function withDietSelect<T extends object>(data: T): T & Record<DietKey, true> {
  const flags = Object.fromEntries(DIET_KEYS.map((key) => [key, true])) as Record<
    DietKey,
    true
  >;
  return { ...data, ...flags };
}

export const DIET_COLUMN_PATTERN =
  /(allergenNotes|noPork|vegetarian|vegan|pescetarian|noBeef|halal|kosher)/;
