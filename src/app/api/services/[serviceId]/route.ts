import { NextResponse } from "next/server";
import { z } from "zod";
import { totalWasteFromLevels } from "@/lib/serviceWasteByLevel";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

const gramsSchema = z.number().int().min(0).max(500_000).nullable();

const PatchBodySchema = z
  .object({
    wasteWeightG: gramsSchema.optional(),
    wasteWeightMaternelleG: gramsSchema.optional(),
    wasteWeightPrimaireG: gramsSchema.optional(),
  })
  .refine(
    (b) =>
      b.wasteWeightG !== undefined ||
      b.wasteWeightMaternelleG !== undefined ||
      b.wasteWeightPrimaireG !== undefined,
    { message: "Au moins un champ déchets requis" },
  );

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

  const nextMat =
    parsed.data.wasteWeightMaternelleG !== undefined
      ? parsed.data.wasteWeightMaternelleG
      : service.wasteWeightMaternelleG;
  const nextPrim =
    parsed.data.wasteWeightPrimaireG !== undefined
      ? parsed.data.wasteWeightPrimaireG
      : service.wasteWeightPrimaireG;

  const data: {
    wasteWeightG?: number | null;
    wasteWeightMaternelleG?: number | null;
    wasteWeightPrimaireG?: number | null;
  } = {};

  if (
    parsed.data.wasteWeightMaternelleG !== undefined ||
    parsed.data.wasteWeightPrimaireG !== undefined
  ) {
    data.wasteWeightMaternelleG =
      parsed.data.wasteWeightMaternelleG !== undefined
        ? parsed.data.wasteWeightMaternelleG
        : service.wasteWeightMaternelleG;
    data.wasteWeightPrimaireG =
      parsed.data.wasteWeightPrimaireG !== undefined
        ? parsed.data.wasteWeightPrimaireG
        : service.wasteWeightPrimaireG;
    data.wasteWeightG = totalWasteFromLevels(nextMat, nextPrim);
  } else if (parsed.data.wasteWeightG !== undefined) {
    // Legacy single field — keep for older clients
    data.wasteWeightG = parsed.data.wasteWeightG;
  }

  const updated = await db.service.update({
    where: { id: serviceId },
    data,
  });

  return NextResponse.json({ service: updated });
}
