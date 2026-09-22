/** Régimes alimentaires (hors allergènes UE-14). */

export function parseOuiNon(raw: string): boolean {
  const v = raw.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  return ["oui", "o", "yes", "y", "1", "true", "x"].includes(v);
}

export function dietConflictsWithMenu(
  student: { noPork: boolean; vegetarian: boolean },
  dishes: Array<{ label: string; containsPork: boolean; containsMeat: boolean }>,
): { noPorkDishes: string[]; vegetarianDishes: string[] } {
  const noPorkDishes = student.noPork
    ? dishes.filter((d) => d.containsPork).map((d) => d.label)
    : [];
  const vegetarianDishes = student.vegetarian
    ? dishes.filter((d) => d.containsMeat || d.containsPork).map((d) => d.label)
    : [];
  return { noPorkDishes, vegetarianDishes };
}

export function countDietForDish(
  students: Array<{ noPork: boolean; vegetarian: boolean }>,
  dish: { containsPork: boolean; containsMeat: boolean },
): { noPork: number; vegetarian: number } {
  let noPork = 0;
  let vegetarian = 0;
  for (const s of students) {
    if (s.noPork && dish.containsPork) noPork++;
    if (s.vegetarian && (dish.containsMeat || dish.containsPork)) vegetarian++;
  }
  return { noPork, vegetarian };
}

/** Ajoute les flags régimes sans casser le client Prisma avant `prisma generate`. */
export function withDietFlags<T extends object>(
  data: T,
  flags: Record<string, boolean>,
): T {
  return { ...data, ...flags } as T;
}

export function withDietSelect<T extends object>(data: T): T {
  return { ...data, noPork: true, vegetarian: true } as T;
}
