import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { MealType } from "@/generated/prisma/client";
import { SCHOOL_MEAL_TYPE } from "@/lib/mealType";

const BodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["LUNCH"]).optional(),
});

function parseLocalDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const date = parseLocalDate(parsed.data.date);
  const mealType = MealType[SCHOOL_MEAL_TYPE];

  const service = await db.service.upsert({
    where: {
      establishmentId_date_mealType: {
        establishmentId: session.establishmentId,
        date,
        mealType,
      },
    },
    create: {
      date,
      mealType,
      establishmentId: session.establishmentId,
    },
    update: {},
  });

  const groups = await db.group.findMany({
    where: { active: true, establishmentId: session.establishmentId },
  });
  if (groups.length > 0) {
    await db.serviceGroupMetrics.createMany({
      data: groups.map((g) => ({
        serviceId: service.id,
        groupId: g.id,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ serviceId: service.id });
}
