import { NextResponse } from "next/server";
import { z } from "zod";
import { excelCsvResponse, unparseCsvSemicolon } from "@/lib/csvExport";
import { resolveExportDateRange } from "@/lib/exportDateRange";
import { mealTypeLabelFr } from "@/lib/mealType";
import { formatServiceDateKey } from "@/lib/serviceDate";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const CATEGORY_FR: Record<string, string> = {
  STARTER: "Entrée",
  MAIN: "Plat",
  DESSERT: "Dessert",
  OTHER: "Autre",
};

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
      Date: formatServiceDateKey(s.date),
      Repas: mealTypeLabelFr(s.mealType),
      Catégorie: CATEGORY_FR[i.category] ?? i.category,
      Plat: i.label,
      Allergènes: i.allergens.join(", "),
      "Grammage (g)": i.grammageG ?? "",
    })),
  );

  const csv = unparseCsvSemicolon(rows);
  return excelCsvResponse(
    csv,
    `cantine360-menus-${range.fromStr}_to_${range.toStr}.csv`,
  );
}
