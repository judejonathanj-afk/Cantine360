import { NextResponse } from "next/server";
import { z } from "zod";
import Papa from "papaparse";
import { unparseCsvSemicolon } from "@/lib/csvExport";
import {
  buildServiceMetricExportRows,
  buildServiceWasteSummaryRows,
} from "@/lib/servicesExport";
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

  const metricRows = buildServiceMetricExportRows(services);
  const wasteSummaryRows = buildServiceWasteSummaryRows(services);

  const sections = [unparseCsvSemicolon(metricRows)];

  if (wasteSummaryRows.length > 0) {
    sections.push("");
    sections.push(
      Papa.unparse(wasteSummaryRows, {
        delimiter: ";",
        quotes: true,
        quoteChar: '"',
      }),
    );
  }

  const csv = "\uFEFF" + sections.join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cantine360-services-${parsed.data.from}_to_${parsed.data.to}.csv"`,
    },
  });
}
