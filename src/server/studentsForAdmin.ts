import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

export type StudentAdminListRow = {
  id: string;
  firstName: string;
  lastName: string;
  allergens: string[];
  allergenNotes: string | null;
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
  const selectBase = {
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
  } as const;

  let rows: Array<{
    id: string;
    firstName: string;
    lastName: string;
    allergens: string[];
    allergenNotes: string | null;
    active: boolean;
    groupId: string;
    group: { name: string; schoolId: string; school: { name: string } };
  }>;

  try {
    rows = await db.student.findMany({
      where: { establishmentId },
      orderBy: [
        { group: { school: { name: "asc" } } },
        { group: { name: "asc" } },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      select: {
        ...selectBase,
        allergenNotes: true,
      },
    });
  } catch (e) {
    if (
      !(
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2022" &&
        String(e.message).includes("allergenNotes")
      )
    ) {
      throw e;
    }
    const fallback = await db.student.findMany({
      where: { establishmentId },
      orderBy: [
        { group: { school: { name: "asc" } } },
        { group: { name: "asc" } },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      select: selectBase,
    });
    rows = fallback.map((r) => ({ ...r, allergenNotes: null }));
  }

  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    allergens: r.allergens,
    allergenNotes: r.allergenNotes,
    active: r.active,
    groupId: r.groupId,
    className: r.group.name,
    schoolId: r.group.schoolId,
    schoolName: r.group.school.name,
  }));
}
