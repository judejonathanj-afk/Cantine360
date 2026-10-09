import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { MenuCategory } from "@/generated/prisma/client";
import { withDietFlags } from "@/lib/dietaryRegime";
import { runDbWrite } from "@/server/runDbWrite";

const ItemSchema = z.object({
  id: z.string().optional(),
  category: z.enum(["STARTER", "MAIN", "DESSERT", "OTHER"]),
  label: z.string().trim().min(1).max(160),
  allergens: z.array(z.string().trim().min(1)).max(30).default([]),
  grammageG: z.number().int().min(1).max(5000).nullable().optional(),
  containsPork: z.boolean().optional().default(false),
  containsMeat: z.boolean().optional().default(false),
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
  const establishmentId = session.establishmentId;

  const { serviceId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const baseItems = parsed.data.items.map((i) => ({
    category: i.category as MenuCategory,
    label: i.label,
    allergens: i.allergens,
    grammageG: i.grammageG ?? null,
    containsPork: Boolean(i.containsPork),
    containsMeat: Boolean(i.containsMeat) || Boolean(i.containsPork),
  }));

  async function replaceMenu(withDiet: boolean) {
    return db.$transaction(async (tx) => {
      const owned = await tx.service.findFirst({
        where: { id: serviceId, establishmentId },
        select: { id: true },
      });
      if (!owned) return null;
      const menu = await tx.menu.upsert({
        where: { serviceId },
        create: { serviceId },
        update: {},
        select: { id: true, serviceId: true },
      });
      await tx.menuItem.deleteMany({ where: { menuId: menu.id } });
      if (baseItems.length > 0) {
        await tx.menuItem.createMany({
          data: baseItems.map((item) => {
            const row = {
              menuId: menu.id,
              category: item.category,
              label: item.label,
              allergens: item.allergens,
              grammageG: item.grammageG,
            };
            return withDiet
              ? withDietFlags(row, {
                  containsPork: item.containsPork,
                  containsMeat: item.containsMeat,
                })
              : row;
          }),
        });
      }
      return {
        id: menu.id,
        serviceId: menu.serviceId,
        items: baseItems.map((item) => ({
          category: item.category,
          label: item.label,
          allergens: item.allergens,
          grammageG: item.grammageG,
          containsPork: item.containsPork,
          containsMeat: item.containsMeat,
        })),
      };
    });
  }

  let menu;
  try {
    menu = await runDbWrite(() => replaceMenu(true));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (!msg.includes("containsPork") && !msg.includes("containsMeat")) throw e;
    menu = await runDbWrite(() => replaceMenu(false));
  }
  if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ menu });
}

