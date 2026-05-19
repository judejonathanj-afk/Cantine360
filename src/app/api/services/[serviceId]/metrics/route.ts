import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

const BodySchema = z.object({
  groupId: z.string().min(1),
  presentCount: z.number().int().min(0).max(500).optional(),
  servedCount: z.number().int().min(0).max(500).optional(),
  refusedCount: z.number().int().min(0).max(500).optional(),
  leftoversCount: z.number().int().min(0).max(500).optional(),
});

export async function PUT(
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
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const group = await db.group.findFirst({
    where: {
      id: parsed.data.groupId,
      establishmentId: session.establishmentId,
    },
  });
  if (!group) {
    return NextResponse.json({ error: "Groupe invalide" }, { status: 400 });
  }

  const updated = await db.serviceGroupMetrics.upsert({
    where: {
      serviceId_groupId: { serviceId, groupId: parsed.data.groupId },
    },
    create: {
      serviceId,
      groupId: parsed.data.groupId,
      presentCount: parsed.data.presentCount ?? 0,
      servedCount: parsed.data.servedCount ?? 0,
      refusedCount: parsed.data.refusedCount ?? 0,
      leftoversCount: parsed.data.leftoversCount ?? 0,
    },
    update: {
      presentCount: parsed.data.presentCount,
      servedCount: parsed.data.servedCount,
      refusedCount: parsed.data.refusedCount,
      leftoversCount: parsed.data.leftoversCount,
    },
  });

  return NextResponse.json({ metrics: updated });
}

