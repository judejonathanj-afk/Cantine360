import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import {
  DIET_COLUMN_PATTERN,
  emptyStudentDiets,
  pickStudentDiets,
  withDietSelect,
  type StudentDiets,
} from "@/lib/dietaryRegime";

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
} & StudentDiets;

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

  let rows: Array<
    {
      id: string;
      firstName: string;
      lastName: string;
      allergens: string[];
      allergenNotes: string | null;
      active: boolean;
      groupId: string;
      group: { name: string; schoolId: string; school: { name: string } };
    } & StudentDiets
  >;

  try {
    rows = await db.student.findMany({
      where: { establishmentId },
      orderBy: [
        { group: { school: { name: "asc" } } },
        { group: { name: "asc" } },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      select: withDietSelect({
        ...selectBase,
        allergenNotes: true,
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const missingNotes =
      (e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2022" &&
        msg.includes("allergenNotes")) ||
      /allergenNotes/.test(msg) && /Unknown arg|does not exist/i.test(msg);
    const missingDiet =
      (e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2022" &&
        DIET_COLUMN_PATTERN.test(msg)) ||
      DIET_COLUMN_PATTERN.test(msg);
    if (!missingNotes && !missingDiet) throw e;
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
    rows = fallback.map((r) => ({
      ...r,
      allergenNotes: null,
      ...emptyStudentDiets(),
    }));
  }

  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    allergens: r.allergens,
    allergenNotes: r.allergenNotes,
    ...pickStudentDiets(r),
    active: r.active,
    groupId: r.groupId,
    className: r.group.name,
    schoolId: r.group.schoolId,
    schoolName: r.group.school.name,
  }));
}
