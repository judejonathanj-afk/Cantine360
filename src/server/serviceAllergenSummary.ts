import type { PrismaClient } from "@/generated/prisma/client";
import { formatGroupLabel } from "@/lib/groupLabel";
import {
  countStudentsAffectedByDish,
  dishesAffectingStudent,
  studentAffectedByMenu,
} from "@/lib/allergenMatch";

export type StudentAllergenRow = {
  id: string;
  firstName: string;
  lastName: string;
  allergens: string[];
  schoolName: string;
  className: string;
  groupLabel: string;
  affectedByMenu: boolean;
  affectedDishes: string[];
};

export type GroupAllergenSummary = {
  groupId: string;
  schoolName: string;
  className: string;
  groupLabel: string;
  studentsTotal: number;
  studentsWithAllergens: number;
  affectedByMenu: number;
  students: StudentAllergenRow[];
};

export type DishAllergenSummary = {
  label: string;
  category: string;
  allergens: string[];
  affectedStudents: number;
};

export type ServiceAllergenSummary = {
  hasMenu: boolean;
  menuAllergensCount: number;
  groups: GroupAllergenSummary[];
  dishes: DishAllergenSummary[];
  totalAffectedStudents: number;
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

  const students = await db.student.findMany({
    where: {
      establishmentId,
      active: true,
      groupId: { in: groupIds },
    },
    select: {
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
    },
  });

  const menuItems = (service.menu?.items ?? []).map((i) => ({
    label: i.label,
    category: i.category,
    allergens: i.allergens,
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
      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        allergens: s.allergens,
        schoolName,
        className,
        groupLabel,
        affectedByMenu: affected,
        affectedDishes: dishesAffectingStudent(s.allergens, menuItems),
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
      students: studentRows,
    };
  });

  const dishes: DishAllergenSummary[] = menuItems.map((item) => ({
    label: item.label,
    category: item.category,
    allergens: item.allergens,
    affectedStudents: countStudentsAffectedByDish(students, item.allergens),
  }));

  const affectedIds = new Set<string>();
  for (const g of groups) {
    for (const s of g.students) {
      if (s.affectedByMenu) affectedIds.add(s.id);
    }
  }

  return {
    hasMenu: menuItems.length > 0,
    menuAllergensCount,
    groups,
    dishes,
    totalAffectedStudents: affectedIds.size,
  };
}
