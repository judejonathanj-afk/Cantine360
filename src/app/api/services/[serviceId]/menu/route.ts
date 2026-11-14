import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { MenuCategory, Prisma } from "@/generated/prisma/client";
import { withDietFlags } from "@/lib/dietaryRegime";
import { runDbWrite } from "@/server/runDbWrite";
import { invalidateServiceScreenCache } from "@/server/serviceScreenRead";

function isMissingMenuDietColumn(e: unknown) {
  const code =
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  if (code === "P2022") return true;
  const meta =
    typeof e === "object" && e !== null && "meta" in e
      ? JSON.stringify((e as { meta: unknown }).meta)
      : "";
  const msg = e instanceof Error ? e.message : String(e);
  return /P2022|ColumnNotFound|does not exist|containsPork|containsMeat|containsBeef|containsFish|isHalal|isKosher|notHalal|notKosher/i.test(
    `${msg} ${meta}`,
  );
}

const ItemSchema = z.object({
  id: z.string().optional(),
  category: z.enum(["STARTER", "MAIN", "DESSERT", "OTHER"]),
  label: z.string().trim().min(1).max(160),
  allergens: z.array(z.string().trim().min(1)).max(30).default([]),
  grammageG: z.number().int().min(1).max(5000).nullable().optional(),
  containsPork: z.boolean().optional().default(false),
  containsMeat: z.boolean().optional().default(false),
  containsBeef: z.boolean().optional().default(false),
  containsFish: z.boolean().optional().default(false),
  isHalal: z.boolean().optional().default(false),
  isKosher: z.boolean().optional().default(false),
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
    containsMeat: Boolean(i.containsMeat) || Boolean(i.containsPork) || Boolean(i.containsBeef),
    containsBeef: Boolean(i.containsBeef),
    containsFish: Boolean(i.containsFish),
    isHalal: Boolean(i.isHalal) && !Boolean(i.containsPork),
    isKosher: Boolean(i.isKosher) && !Boolean(i.containsPork),
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
        update: { updatedAt: new Date() },
        select: { id: true, serviceId: true },
      });
      await tx.menuItem.deleteMany({ where: { menuId: menu.id } });
      if (baseItems.length > 0) {
        if (withDiet) {
          await tx.menuItem.createMany({
            data: baseItems.map((item) => {
              const row = {
                menuId: menu.id,
                category: item.category,
                label: item.label,
                allergens: item.allergens,
                grammageG: item.grammageG,
              };
              return withDietFlags(row, {
                containsPork: item.containsPork,
                containsMeat: item.containsMeat,
                containsBeef: item.containsBeef,
                containsFish: item.containsFish,
                isHalal: item.isHalal,
                isKosher: item.isKosher,
              });
            }),
          });
        } else {
          // Prisma envoie quand même les colonnes régimes (défauts schéma) :
          // insert SQL sans ces colonnes si la prod n’est pas migrée.
          for (const item of baseItems) {
            const allergensSql =
              item.allergens.length === 0
                ? Prisma.sql`'{}'::text[]`
                : Prisma.sql`ARRAY[${Prisma.join(item.allergens)}]::text[]`;
            await tx.$executeRaw(
              Prisma.sql`
                INSERT INTO "MenuItem" ("id","menuId","category","label","allergens","grammageG","createdAt","updatedAt")
                VALUES (
                  ${crypto.randomUUID()},
                  ${menu.id},
                  CAST(${item.category} AS "MenuCategory"),
                  ${item.label},
                  ${allergensSql},
                  ${item.grammageG},
                  NOW(),
                  NOW()
                )
              `,
            );
          }
        }
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
          containsBeef: item.containsBeef,
          containsFish: item.containsFish,
          isHalal: item.isHalal,
          isKosher: item.isKosher,
        })),
      };
    });
  }

  let menu;
  try {
    try {
      menu = await runDbWrite(() => replaceMenu(true));
    } catch (e) {
      if (!isMissingMenuDietColumn(e)) throw e;
      menu = await runDbWrite(() => replaceMenu(false));
    }
  } catch (e) {
    console.error("[menu PUT]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
  if (!menu) return NextResponse.json({ error: "Not found" }, { status: 404 });
  invalidateServiceScreenCache(establishmentId, serviceId);
  revalidatePath(`/service/${serviceId}`);
  revalidatePath(`/service/${serviceId}/menu`);
  revalidatePath("/service", "layout");
  return NextResponse.json({ menu });
}

