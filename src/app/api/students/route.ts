import { NextResponse } from "next/server";
import { z } from "zod";
import { EU14_ALLERGENS } from "@/lib/allergens";
import { withDietFlags } from "@/lib/dietaryRegime";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getStudentsForAdmin } from "@/server/studentsForAdmin";

const CreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  groupId: z.string().trim().min(1),
  allergens: z.array(z.enum(EU14_ALLERGENS)).default([]),
  allergenNotes: z.string().trim().max(500).optional().nullable(),
  noPork: z.boolean().optional().default(false),
  vegetarian: z.boolean().optional().default(false),
});

export async function GET() {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      data: withDietFlags(
        {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          allergens: parsed.data.allergens,
          allergenNotes: parsed.data.allergenNotes?.trim()
            ? parsed.data.allergenNotes.trim()
            : null,
          groupId: group.id,
          establishmentId: session.establishmentId,
        },
        { noPork: parsed.data.noPork, vegetarian: parsed.data.vegetarian },
      ),
    });
    return NextResponse.json(
      {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          allergens: student.allergens,
          allergenNotes: student.allergenNotes,
          noPork:
            "noPork" in student
              ? Boolean((student as { noPork?: boolean }).noPork)
              : parsed.data.noPork,
          vegetarian:
            "vegetarian" in student
              ? Boolean((student as { vegetarian?: boolean }).vegetarian)
              : parsed.data.vegetarian,
          active: student.active,
          groupId: group.id,
          className: group.name,
          schoolId: group.schoolId,
          schoolName: group.school.name,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/(noPork|vegetarian)/.test(msg)) {
      try {
        const student = await db.student.create({
          data: {
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            allergens: parsed.data.allergens,
            allergenNotes: parsed.data.allergenNotes?.trim()
              ? parsed.data.allergenNotes.trim()
              : null,
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
              allergenNotes: student.allergenNotes,
              noPork: false,
              vegetarian: false,
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
        /* duplicate */
      }
    }
    return NextResponse.json(
      { error: "Élève déjà présent dans cette classe (même nom/prénom)" },
      { status: 409 },
    );
  }
}
