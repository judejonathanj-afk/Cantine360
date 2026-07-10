import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

const PatchBodySchema = z.object({
  wasteWeightG: z.number().int().min(0).max(500_000).nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { serviceId } = await params;
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId: session.establishmentId },
    include: {
      metrics: {
        include: { group: { include: { school: true } } },
        orderBy: [{ group: { school: { name: "asc" } } }, { group: { name: "asc" } }],
      },
    },
  });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ service });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { serviceId } = await params;
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId: session.establishmentId },
  });
  if (!service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updated = await db.service.update({
    where: { id: serviceId },
    data: { wasteWeightG: parsed.data.wasteWeightG },
  });

  return NextResponse.json({ service: updated });
}

