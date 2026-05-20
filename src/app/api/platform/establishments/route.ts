import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeEstablishmentPin,
  resolveEstablishmentSlug,
  validateEstablishmentPins,
} from "@/lib/platformEstablishment";
import { getPlatformSession } from "@/server/auth";
import { db } from "@/server/db";
import { platformDbErrorResponse } from "@/server/platformDbErrors";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(64).optional(),
  adminPin: z.string().min(1).max(32),
  kitchenPin: z.string().min(1).max(32),
});

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const establishments = await db.establishment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { groups: true } },
      },
    });

    return NextResponse.json({ establishments });
  } catch {
    return NextResponse.json(
      { error: "Erreur base de données — vérifiez DATABASE_URL." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }

  const adminPin = normalizeEstablishmentPin(parsed.data.adminPin);
  const kitchenPin = normalizeEstablishmentPin(parsed.data.kitchenPin);
  const pinError = validateEstablishmentPins(adminPin, kitchenPin);
  if (pinError) {
    return NextResponse.json({ error: pinError }, { status: 400 });
  }

  const resolved = resolveEstablishmentSlug(
    parsed.data.name,
    parsed.data.slug,
  );
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }
  const slug = resolved.slug;

  try {
    const taken = await db.establishment.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (taken) {
      return NextResponse.json(
        {
          error: `Le code « ${slug} » est déjà utilisé (${taken.name}).`,
          existing: taken,
        },
        { status: 409 },
      );
    }

    const establishment = await db.establishment.create({
      data: {
        name: parsed.data.name,
        slug,
        adminPin,
        kitchenPin,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ establishment }, { status: 201 });
  } catch (e) {
    return platformDbErrorResponse(e, "[POST /api/platform/establishments]");
  }
}
