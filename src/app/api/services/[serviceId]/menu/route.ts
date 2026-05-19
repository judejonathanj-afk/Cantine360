import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { MenuCategory } from "@/generated/prisma/client";

const ItemSchema = z.object({
  id: z.string().optional(),
  category: z.enum(["STARTER", "MAIN", "DESSERT", "OTHER"]),
  label: z.string().trim().min(1).max(160),
  allergens: z.array(z.string().trim().min(1)).max(30).default([]),
});

const PutSchema = z.object({
  items: z.array(ItemSchema).max(100),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { serviceId } = await params;
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId: session.establishmentId },
    include: { menu: { include: { items: { orderBy: [{ createdAt: "asc" }] } } } },
  });
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ menu: service.menu ?? { serviceId, items: [] } });
}

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
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = PutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const menu = await db.menu.upsert({
    where: { serviceId },
    create: { serviceId },
    update: {},
  });

  // Replace items (simple pilot approach)
  await db.menuItem.deleteMany({ where: { menuId: menu.id } });
  if (parsed.data.items.length > 0) {
    await db.menuItem.createMany({
      data: parsed.data.items.map((i) => ({
        menuId: menu.id,
        category: i.category as MenuCategory,
        label: i.label,
        allergens: i.allergens,
      })),
    });
  }

  const updated = await db.menu.findUnique({
    where: { id: menu.id },
    include: { items: { orderBy: [{ createdAt: "asc" }] } },
  });
  return NextResponse.json({ menu: updated });
}

