import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { runDbWrite } from "@/server/runDbWrite";

const CountsSchema = z.object({
  groupId: z.string().min(1),
  presentCount: z.number().int().min(0).max(1_000_000).optional(),
  servedCount: z.number().int().min(0).max(1_000_000).optional(),
  rabCount: z.number().int().min(0).max(1_000_000).optional(),
  refusedCount: z.number().int().min(0).max(1_000_000).optional(),
});

const BodySchema = z.union([
  z.object({ groups: z.array(CountsSchema).min(1).max(80) }),
  CountsSchema,
]);

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { serviceId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const incoming =
    "groups" in parsed.data ? parsed.data.groups : [parsed.data];
  const byGroup = new Map<string, (typeof incoming)[number]>();
  for (const row of incoming) byGroup.set(row.groupId, row);
  const rows = [...byGroup.values()];

  // Une lecture : service du tenant + classes du même établissement.
  const service = await db.service.findFirst({
    where: {
      id: serviceId,
      establishmentId: session.establishmentId,
    },
    select: {
      id: true,
      establishment: {
        select: {
          groups: {
            where: { id: { in: rows.map((row) => row.groupId) } },
            select: { id: true },
          },
        },
      },
    },
  });
  if (!service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const validIds = new Set(service.establishment.groups.map((g) => g.id));
  const accepted = rows.filter((row) => validIds.has(row.groupId));
  if (accepted.length === 0) {
    return NextResponse.json({ error: "Groupe invalide" }, { status: 400 });
  }

  const updated = await runDbWrite(() =>
    db.$transaction(
      accepted.map((row) =>
        db.serviceGroupMetrics.upsert({
          where: {
            serviceId_groupId: { serviceId, groupId: row.groupId },
          },
          create: {
            serviceId,
            groupId: row.groupId,
            presentCount: row.presentCount ?? 0,
            servedCount: row.servedCount ?? 0,
            rabCount: row.rabCount ?? 0,
            refusedCount: row.refusedCount ?? 0,
            leftoversCount: 0,
          },
          update: {
            presentCount: row.presentCount,
            servedCount: row.servedCount,
            rabCount: row.rabCount,
            refusedCount: row.refusedCount,
            leftoversCount: 0,
          },
        }),
      ),
    ),
  );

  return NextResponse.json({ updated: updated.length, metrics: updated });
}
