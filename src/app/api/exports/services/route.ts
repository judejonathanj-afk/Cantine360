import { NextResponse } from "next/server";
import { z } from "zod";
import { excelCsvResponse, unparseCsvSemicolon } from "@/lib/csvExport";
import { resolveExportDateRange } from "@/lib/exportDateRange";
import { buildServiceMetricExportRows } from "@/lib/servicesExport";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

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

  const range = resolveExportDateRange(parsed.data.from, parsed.data.to);
  if (!range.ok) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const services = await db.service.findMany({
    where: {
      date: { gte: range.from, lt: range.toExclusive },
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

  // Un seul tableau Excel : métriques + déchets mat/prim/total.
  const csv = unparseCsvSemicolon(buildServiceMetricExportRows(services));
  return excelCsvResponse(
    csv,
    `cantine360-services-${range.fromStr}_to_${range.toStr}.csv`,
  );
}
