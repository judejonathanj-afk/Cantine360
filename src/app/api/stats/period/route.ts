import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { z } from "zod";

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    days: url.searchParams.get("days") ?? "30",
  });
  const days = parsed.success ? parsed.data.days : 30;

  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  const agg = await db.serviceGroupMetrics.aggregate({
    where: {
      service: {
        date: { gte: start },
        establishmentId: session.establishmentId,
      },
    },
    _sum: {
      presentCount: true,
      servedCount: true,
      refusedCount: true,
      leftoversCount: true,
    },
  });

  return NextResponse.json({
    days,
    present: agg._sum.presentCount ?? 0,
    served: agg._sum.servedCount ?? 0,
    refused: agg._sum.refusedCount ?? 0,
    leftovers: agg._sum.leftoversCount ?? 0,
  });
}
