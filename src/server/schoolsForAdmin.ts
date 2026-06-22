import type { PrismaClient } from "@/generated/prisma/client";

export type SchoolAdminListRow = {
  id: string;
  name: string;
  active: boolean;
  groupCount: number;
};

export async function getSchoolsForAdmin(
  db: PrismaClient,
  establishmentId: string,
): Promise<SchoolAdminListRow[]> {
  const schools = await db.school.findMany({
    where: { establishmentId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      active: true,
      _count: { select: { groups: true } },
    },
  });

  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    active: s.active,
    groupCount: s._count.groups,
  }));
}
