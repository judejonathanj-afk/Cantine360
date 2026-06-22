import { NextResponse } from "next/server";
import { z } from "zod";
import { EU14_ALLERGENS } from "@/lib/allergens";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

const PatchSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  groupId: z.string().trim().min(1).optional(),
  allergens: z.array(z.enum(EU14_ALLERGENS)).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await db.student.findFirst({
    where: { id: studentId, establishmentId: session.establishmentId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: {
    firstName?: string;
    lastName?: string;
    groupId?: string;
    allergens?: string[];
    active?: boolean;
  } = {};

  if (parsed.data.firstName !== undefined) data.firstName = parsed.data.firstName;
  if (parsed.data.lastName !== undefined) data.lastName = parsed.data.lastName;
  if (parsed.data.allergens !== undefined) data.allergens = parsed.data.allergens;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;

  if (parsed.data.groupId !== undefined) {
    const group = await db.group.findFirst({
      where: { id: parsed.data.groupId, establishmentId: session.establishmentId },
      select: { id: true },
    });
    if (!group) {
      return NextResponse.json({ error: "Classe introuvable" }, { status: 404 });
    }
    data.groupId = group.id;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  try {
    const student = await db.student.update({
      where: { id: studentId },
      data,
    });
    return NextResponse.json({ student });
  } catch {
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 409 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await params;
  const existing = await db.student.findFirst({
    where: { id: studentId, establishmentId: session.establishmentId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.student.delete({ where: { id: studentId } });
  return NextResponse.json({ ok: true });
}
