import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getGroupsForAdmin } from "@/server/groupsForAdmin";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  schoolId: z.string().trim().min(1),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await getGroupsForAdmin(db, session.establishmentId);
  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const school = await db.school.findFirst({
    where: { id: parsed.data.schoolId, establishmentId: session.establishmentId },
    select: { id: true },
  });
  if (!school) {
    return NextResponse.json({ error: "École introuvable" }, { status: 404 });
  }

  const group = await db.group.create({
    data: {
      name: parsed.data.name,
      schoolId: school.id,
      establishmentId: session.establishmentId,
    },
    select: {
      id: true,
      name: true,
      active: true,
      schoolId: true,
      school: { select: { name: true } },
    },
  });

  return NextResponse.json(
    {
      group: {
        id: group.id,
        name: group.name,
        active: group.active,
        schoolId: group.schoolId,
        schoolName: group.school.name,
        ecoRestesServisTargetPct: null as number | null,
        ecoReductionTargetPct: null as number | null,
      },
    },
    { status: 201 },
  );
}
