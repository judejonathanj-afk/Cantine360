import { NextResponse } from "next/server";
import { z } from "zod";
import { EU14_ALLERGENS } from "@/lib/allergens";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getStudentsForAdmin } from "@/server/studentsForAdmin";

const CreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  groupId: z.string().trim().min(1),
  allergens: z.array(z.enum(EU14_ALLERGENS)).default([]),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await getStudentsForAdmin(db, session.establishmentId);
  return NextResponse.json({ students });
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

  const group = await db.group.findFirst({
    where: { id: parsed.data.groupId, establishmentId: session.establishmentId },
    select: {
      id: true,
      name: true,
      schoolId: true,
      school: { select: { name: true } },
    },
  });
  if (!group) {
    return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
  }

  try {
    const student = await db.student.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        allergens: parsed.data.allergens,
        groupId: group.id,
        establishmentId: session.establishmentId,
      },
    });
    return NextResponse.json(
      {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          allergens: student.allergens,
          active: student.active,
          groupId: group.id,
          className: group.name,
          schoolId: group.schoolId,
          schoolName: group.school.name,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Élève déjà présent dans cette classe (même nom/prénom)" },
      { status: 409 },
    );
  }
}
