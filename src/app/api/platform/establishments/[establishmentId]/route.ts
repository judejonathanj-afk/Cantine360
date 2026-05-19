import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeEstablishmentPin,
  resolveEstablishmentSlug,
  validateEstablishmentPins,
} from "@/lib/platformEstablishment";
import { getPlatformSession } from "@/server/auth";
import { db } from "@/server/db";

const PatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().max(64).optional(),
    adminPin: z.string().min(1).max(32).optional(),
    kitchenPin: z.string().min(1).max(32).optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.slug !== undefined ||
      d.adminPin !== undefined ||
      d.kitchenPin !== undefined,
    { message: "Aucune modification." },
  );

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ establishmentId: string }> },
) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { establishmentId } = await params;
  const establishment = await db.establishment.findUnique({
    where: { id: establishmentId },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { groups: true, services: true } },
    },
  });

  if (!establishment) {
    return NextResponse.json({ error: "Établissement introuvable." }, { status: 404 });
  }

  return NextResponse.json({ establishment });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ establishmentId: string }> },
) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { establishmentId } = await params;
  const existing = await db.establishment.findUnique({
    where: { id: establishmentId },
    select: {
      id: true,
      name: true,
      slug: true,
      adminPin: true,
      kitchenPin: true,
      accessCredentialRevision: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Établissement introuvable." }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const nextName = parsed.data.name ?? existing.name;
  let nextSlug = existing.slug;
  if (parsed.data.slug !== undefined) {
    const resolved = resolveEstablishmentSlug(nextName, parsed.data.slug);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    nextSlug = resolved.slug;
  } else if (parsed.data.name !== undefined) {
    // Le nom change sans slug explicite : on ne modifie pas le code connexion automatiquement.
    nextSlug = existing.slug;
  }

  const nextAdminPin =
    parsed.data.adminPin !== undefined
      ? normalizeEstablishmentPin(parsed.data.adminPin)
      : existing.adminPin;
  const nextKitchenPin =
    parsed.data.kitchenPin !== undefined
      ? normalizeEstablishmentPin(parsed.data.kitchenPin)
      : existing.kitchenPin;

  const pinError = validateEstablishmentPins(nextAdminPin, nextKitchenPin);
  if (pinError) {
    return NextResponse.json({ error: pinError }, { status: 400 });
  }

  const pinsTouched =
    parsed.data.adminPin !== undefined || parsed.data.kitchenPin !== undefined;

  try {
    await db.establishment.update({
      where: { id: establishmentId },
      data: {
        name: nextName,
        slug: nextSlug,
        adminPin: nextAdminPin,
        kitchenPin: nextKitchenPin,
        ...(pinsTouched ? { accessCredentialRevision: { increment: 1 } } : {}),
      },
    });

    const fresh = await db.establishment.findUnique({
      where: { id: establishmentId },
      select: {
        id: true,
        name: true,
        slug: true,
        adminPin: true,
        kitchenPin: true,
        updatedAt: true,
        accessCredentialRevision: true,
      },
    });
    if (!fresh) {
      return NextResponse.json({ error: "Établissement introuvable." }, { status: 404 });
    }

    const pinChanges: { adminPin?: string; kitchenPin?: string } = {};
    if (parsed.data.adminPin !== undefined) {
      pinChanges.adminPin = normalizeEstablishmentPin(fresh.adminPin);
    }
    if (parsed.data.kitchenPin !== undefined) {
      pinChanges.kitchenPin = normalizeEstablishmentPin(fresh.kitchenPin);
    }

    return NextResponse.json({
      establishment: {
        id: fresh.id,
        name: fresh.name,
        slug: fresh.slug,
        updatedAt: fresh.updatedAt,
      },
      codesUpdated: Object.keys(pinChanges).length > 0,
      pinChanges,
      sessionsInvalidated: pinsTouched,
    });
  } catch {
    return NextResponse.json(
      { error: "Ce code établissement est déjà utilisé par un autre site." },
      { status: 409 },
    );
  }
}
