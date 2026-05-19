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

  const metrics = await db.serviceGroupMetrics.findMany({
    where: {
      service: {
        date: { gte: start },
        establishmentId: session.establishmentId,
      },
    },
    select: {
      presentCount: true,
      servedCount: true,
      refusedCount: true,
      leftoversCount: true,
    },
  });

  const totals = metrics.reduce(
    (acc, m) => ({
      present: acc.present + m.presentCount,
      served: acc.served + m.servedCount,
      refused: acc.refused + m.refusedCount,
      leftovers: acc.leftovers + m.leftoversCount,
    }),
    { present: 0, served: 0, refused: 0, leftovers: 0 },
  );

  return NextResponse.json({ days, ...totals });
}
