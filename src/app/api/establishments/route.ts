import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(2).max(64),
  adminPin: z.string().min(1).max(32),
  kitchenPin: z.string().min(1).max(32),
});

function normalizeSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Création d’un nouvel établissement (provisionnement). Protégé par BOOTSTRAP_SECRET — pas d’auth session. */
export async function POST(req: Request) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret || secret.length < 16) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const slug = normalizeSlug(parsed.data.slug);
  if (slug.length < 2) {
    return NextResponse.json({ error: "Slug trop court" }, { status: 400 });
  }

  try {
    const establishment = await db.establishment.create({
      data: {
        name: parsed.data.name,
        slug,
        adminPin: parsed.data.adminPin,
        kitchenPin: parsed.data.kitchenPin,
      },
    });
    return NextResponse.json({ establishment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Slug déjà utilisé ou erreur base." },
      { status: 409 },
    );
  }
}
