import type { PrismaClient } from "@/generated/prisma/client";

export type StudentAdminListRow = {
  id: string;
  firstName: string;
  lastName: string;
  allergens: string[];
  active: boolean;
  groupId: string;
  className: string;
  schoolId: string;
  schoolName: string;
};

export async function getStudentsForAdmin(
  db: PrismaClient,
  establishmentId: string,
): Promise<StudentAdminListRow[]> {
  const rows = await db.student.findMany({
    where: { establishmentId },
    orderBy: [
      { group: { school: { name: "asc" } } },
      { group: { name: "asc" } },
      { lastName: "asc" },
      { firstName: "asc" },
    ],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      allergens: true,
      active: true,
      groupId: true,
      group: {
        select: {
          name: true,
          schoolId: true,
          school: { select: { name: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    allergens: r.allergens,
    active: r.active,
    groupId: r.groupId,
    className: r.group.name,
    schoolId: r.group.schoolId,
    schoolName: r.group.school.name,
  }));
}
