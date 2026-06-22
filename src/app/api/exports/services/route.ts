import { NextResponse } from "next/server";
import { z } from "zod";
import { unparseCsvSemicolon } from "@/lib/csvExport";
import { formatGroupLabel } from "@/lib/groupLabel";
import { formatServiceDateKey } from "@/lib/serviceDate";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function parseLocalDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const from = parseLocalDate(parsed.data.from);
  const to = parseLocalDate(parsed.data.to);
  // inclusive end (add 1 day)
  const toExclusive = new Date(to.getTime() + 24 * 60 * 60 * 1000);

  const services = await db.service.findMany({
    where: {
      date: { gte: from, lt: toExclusive },
      establishmentId: session.establishmentId,
    },
    orderBy: [{ date: "asc" }, { mealType: "asc" }],
    include: {
      metrics: {
        include: { group: { include: { school: true } } },
        orderBy: [{ group: { school: { name: "asc" } } }, { group: { name: "asc" } }],
      },
    },
  });

  const rows = services.flatMap((s) =>
    s.metrics.map((m) => ({
      date: formatServiceDateKey(s.date),
      mealType: s.mealType,
      school: m.group.school.name,
      group: m.group.name,
      groupLabel: formatGroupLabel(m.group.school.name, m.group.name),
      presentCount: m.presentCount,
      servedCount: m.servedCount,
      rabCount: m.rabCount,
      refusedCount: m.refusedCount,
      leftoversCount: m.leftoversCount,
    })),
  );

  const csv = unparseCsvSemicolon(rows);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cantine360-services-${parsed.data.from}_to_${parsed.data.to}.csv"`,
    },
  });
}

