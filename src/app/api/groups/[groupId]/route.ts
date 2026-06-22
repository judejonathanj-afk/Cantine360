import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { isMissingEcoPeriodColumns } from "@/server/establishmentEco";

const PatchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  schoolId: z.string().trim().min(1).optional(),
  active: z.boolean().optional(),
  ecoRestesServisTargetPct: z.number().min(0).max(100).nullable().optional(),
  ecoReductionTargetPct: z.number().min(0).max(100).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { groupId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await db.group.findFirst({
    where: { id: groupId, establishmentId: session.establishmentId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const p = parsed.data;
  const data: {
    name?: string;
    schoolId?: string;
    active?: boolean;
    ecoRestesServisTargetPct?: number | null;
    ecoReductionTargetPct?: number | null;
  } = {};
  if (p.name !== undefined) data.name = p.name;
  if (p.schoolId !== undefined) {
    const school = await db.school.findFirst({
      where: { id: p.schoolId, establishmentId: session.establishmentId },
      select: { id: true },
    });
    if (!school) {
      return NextResponse.json({ error: "École introuvable" }, { status: 404 });
    }
    data.schoolId = school.id;
  }
  if (p.active !== undefined) data.active = p.active;
  if (p.ecoRestesServisTargetPct !== undefined) data.ecoRestesServisTargetPct = p.ecoRestesServisTargetPct;
  if (p.ecoReductionTargetPct !== undefined) data.ecoReductionTargetPct = p.ecoReductionTargetPct;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  try {
    const group = await db.group.update({
      where: { id: groupId },
      data,
    });

    if (p.ecoRestesServisTargetPct !== undefined || p.ecoReductionTargetPct !== undefined) {
      revalidatePath("/dashboard");
      revalidatePath("/admin/groups");
    }

    return NextResponse.json({ group });
  } catch (e) {
    if (!isMissingEcoPeriodColumns(e)) {
      return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
    }
    const rest = { ...data };
    delete rest.ecoRestesServisTargetPct;
    delete rest.ecoReductionTargetPct;
    if (Object.keys(rest).length === 0) {
      return NextResponse.json(
        {
          error:
            "Colonnes objectifs groupe absentes sur cette base. Exécutez : npx prisma migrate deploy",
        },
        { status: 503 },
      );
    }
    const group = await db.group.update({
      where: { id: groupId },
      data: rest,
    });
    if (p.ecoRestesServisTargetPct !== undefined || p.ecoReductionTargetPct !== undefined) {
      revalidatePath("/dashboard");
      revalidatePath("/admin/groups");
    }
    return NextResponse.json({
      group,
      warning:
        "Les objectifs par classe ne sont pas encore enregistrables sur cette base (migration manquante). Les autres champs ont été mis à jour.",
    });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { groupId } = await params;
  const existing = await db.group.findFirst({
    where: { id: groupId, establishmentId: session.establishmentId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await db.group.delete({ where: { id: groupId } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

