import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { formatGroupLabel } from "@/lib/groupLabel";
import {
  countStudentsAffectedByDish,
  dishesAffectingStudent,
  studentAffectedByMenu,
} from "@/lib/allergenMatch";
import { countDietForDish, dietConflictsWithMenu } from "@/lib/dietaryRegime";
import { withDietSelect } from "@/lib/dietaryRegime";

function isMissingOptionalStudentColumn(e: unknown, column: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2022" &&
    String(e.message).includes(column)
  );
}

export type StudentAllergenRow = {
  id: string;
  firstName: string;
  lastName: string;
  allergens: string[];
  allergenNotes: string | null;
  schoolName: string;
  className: string;
  groupLabel: string;
  noPork: boolean;
  vegetarian: boolean;
  affectedByMenu: boolean;
  affectedDishes: string[];
  dietAffectedByMenu: boolean;
  dietDishes: string[];
};

export type GroupAllergenSummary = {
  groupId: string;
  schoolName: string;
  className: string;
  groupLabel: string;
  studentsTotal: number;
  studentsWithAllergens: number;
  affectedByMenu: number;
  studentsNoPork: number;
  studentsVegetarian: number;
  dietAffectedByMenu: number;
  students: StudentAllergenRow[];
};

export type DishAllergenSummary = {
  label: string;
  category: string;
  allergens: string[];
  containsPork: boolean;
  containsMeat: boolean;
  affectedStudents: number;
  noPorkStudents: number;
  vegetarianStudents: number;
};

export type ServiceAllergenSummary = {
  hasMenu: boolean;
  menuAllergensCount: number;
  groups: GroupAllergenSummary[];
  dishes: DishAllergenSummary[];
  totalAffectedStudents: number;
  totalNoPork: number;
  totalVegetarian: number;
  totalDietAffected: number;
};

export async function getServiceAllergenSummary(
  db: PrismaClient,
  establishmentId: string,
  serviceId: string,
): Promise<ServiceAllergenSummary | null> {
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId },
    include: {
      menu: { include: { items: true } },
      metrics: {
        include: {
          group: { include: { school: true } },
        },
      },
    },
  });
  if (!service) return null;

  const groupIds = service.metrics.map((m) => m.groupId);

  const studentSelectBase = {
    id: true,
    firstName: true,
    lastName: true,
    allergens: true,
    groupId: true,
    group: {
      select: {
        name: true,
        school: { select: { name: true } },
      },
    },
  } as const;

  let students: Array<{
    id: string;
    firstName: string;
    lastName: string;
    allergens: string[];
    allergenNotes: string | null;
    noPork: boolean;
    vegetarian: boolean;
    groupId: string;
    group: { name: string; school: { name: string } };
  }>;

  const whereStudents = {
    establishmentId,
    active: true,
    groupId: { in: groupIds },
  };

  try {
    students = await db.student.findMany({
      where: whereStudents,
      select: withDietSelect({
        ...studentSelectBase,
        allergenNotes: true,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const missingOptional =
      isMissingOptionalStudentColumn(e, "allergenNotes") ||
      isMissingOptionalStudentColumn(e, "noPork") ||
      isMissingOptionalStudentColumn(e, "vegetarian") ||
      /(allergenNotes|noPork|vegetarian)/.test(msg);
    if (!missingOptional) throw e;
    const rows = await db.student.findMany({
      where: whereStudents,
      select: studentSelectBase,
    });
    students = rows.map((s) => ({
      ...s,
      allergenNotes: null,
      noPork: false,
      vegetarian: false,
    }));
  }

  const menuItems = (service.menu?.items ?? []).map((i) => ({
    label: i.label,
    category: i.category,
    allergens: i.allergens,
    containsPork: Boolean(
      "containsPork" in i && (i as { containsPork?: boolean }).containsPork,
    ),
    containsMeat: Boolean(
      "containsMeat" in i && (i as { containsMeat?: boolean }).containsMeat,
    ),
  }));

  const menuAllergenSets = menuItems.map((i) => i.allergens);
  const menuAllergensCount = new Set(menuAllergenSets.flat()).size;

  const studentsByGroup = new Map<string, typeof students>();
  for (const s of students) {
    const list = studentsByGroup.get(s.groupId) ?? [];
    list.push(s);
    studentsByGroup.set(s.groupId, list);
  }

  const groups: GroupAllergenSummary[] = service.metrics.map((m) => {
    const classStudents = studentsByGroup.get(m.groupId) ?? [];
    const schoolName = m.group.school.name;
    const className = m.group.name;
    const groupLabel = formatGroupLabel(schoolName, className);

    const studentRows: StudentAllergenRow[] = classStudents.map((s) => {
      const affected = studentAffectedByMenu(s.allergens, menuAllergenSets);
      const diet = dietConflictsWithMenu(s, menuItems);
      const dietDishes = [
        ...new Set([...diet.noPorkDishes, ...diet.vegetarianDishes]),
      ];
      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        allergens: s.allergens,
        allergenNotes: s.allergenNotes,
        schoolName,
        className,
        groupLabel,
        noPork: s.noPork,
        vegetarian: s.vegetarian,
        affectedByMenu: affected,
        affectedDishes: dishesAffectingStudent(s.allergens, menuItems),
        dietAffectedByMenu: dietDishes.length > 0,
        dietDishes,
      };
    });

    const withAllergens = studentRows.filter((s) => s.allergens.length > 0);
    const affected = withAllergens.filter((s) => s.affectedByMenu);

    return {
      groupId: m.groupId,
      schoolName,
      className,
      groupLabel,
      studentsTotal: studentRows.length,
      studentsWithAllergens: withAllergens.length,
      affectedByMenu: affected.length,
      studentsNoPork: studentRows.filter((s) => s.noPork).length,
      studentsVegetarian: studentRows.filter((s) => s.vegetarian).length,
      dietAffectedByMenu: studentRows.filter((s) => s.dietAffectedByMenu).length,
      students: studentRows,
    };
  });

  const dishes: DishAllergenSummary[] = menuItems.map((item) => {
    const diet = countDietForDish(students, item);
    return {
      label: item.label,
      category: item.category,
      allergens: item.allergens,
      containsPork: item.containsPork,
      containsMeat: item.containsMeat,
      affectedStudents: countStudentsAffectedByDish(students, item.allergens),
      noPorkStudents: diet.noPork,
      vegetarianStudents: diet.vegetarian,
    };
  });

  const affectedIds = new Set<string>();
  const noPorkIds = new Set<string>();
  const vegetarianIds = new Set<string>();
  const dietAffectedIds = new Set<string>();
  for (const g of groups) {
    for (const s of g.students) {
      if (s.affectedByMenu) affectedIds.add(s.id);
      if (s.noPork) noPorkIds.add(s.id);
      if (s.vegetarian) vegetarianIds.add(s.id);
      if (s.dietAffectedByMenu) dietAffectedIds.add(s.id);
    }
  }

  return {
    hasMenu: menuItems.length > 0,
    menuAllergensCount,
    groups,
    dishes,
    totalAffectedStudents: affectedIds.size,
    totalNoPork: noPorkIds.size,
    totalVegetarian: vegetarianIds.size,
    totalDietAffected: dietAffectedIds.size,
  };
}
