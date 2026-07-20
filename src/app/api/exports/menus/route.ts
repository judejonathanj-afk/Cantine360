import { NextResponse } from "next/server";
import { z } from "zod";
import { unparseCsvSemicolon } from "@/lib/csvExport";
import { resolveExportDateRange } from "@/lib/exportDateRange";
import { formatServiceDateKey } from "@/lib/serviceDate";
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
    include: { menu: { include: { items: true } } },
  });

  const rows = services.flatMap((s) =>
    (s.menu?.items ?? []).map((i) => ({
      date: formatServiceDateKey(s.date),
      mealType: s.mealType,
      category: i.category,
      label: i.label,
      allergens: i.allergens.join(", "),
      grammageG: i.grammageG ?? "",
    })),
  );

  const csv = unparseCsvSemicolon(rows);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cantine360-menus-${range.fromStr}_to_${range.toStr}.csv"`,
    },
  });
}
