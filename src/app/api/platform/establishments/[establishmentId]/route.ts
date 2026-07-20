import { NextResponse } from "next/server";
import { z } from "zod";
import {
  normalizeEstablishmentPin,
  resolveEstablishmentSlug,
  validateEstablishmentPins,
} from "@/lib/platformEstablishment";
import {
  hashEstablishmentPin,
  verifyEstablishmentPin,
} from "@/lib/pinHash";
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
    nextSlug = existing.slug;
  }

  const adminPlain =
    parsed.data.adminPin !== undefined
      ? normalizeEstablishmentPin(parsed.data.adminPin)
      : null;
  const kitchenPlain =
    parsed.data.kitchenPin !== undefined
      ? normalizeEstablishmentPin(parsed.data.kitchenPin)
      : null;

  if (adminPlain !== null && adminPlain.length < 4) {
    return NextResponse.json(
      { error: "Le code admin doit contenir au moins 4 chiffres." },
      { status: 400 },
    );
  }
  if (kitchenPlain !== null && kitchenPlain.length < 4) {
    return NextResponse.json(
      { error: "Le code cuisine doit contenir au moins 4 chiffres." },
      { status: 400 },
    );
  }

  if (adminPlain !== null && kitchenPlain !== null) {
    const pinError = validateEstablishmentPins(adminPlain, kitchenPlain);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }
  } else if (adminPlain !== null) {
    if (await verifyEstablishmentPin(adminPlain, existing.kitchenPin)) {
      return NextResponse.json(
        { error: "Les codes admin et cuisine doivent être différents." },
        { status: 400 },
      );
    }
  } else if (kitchenPlain !== null) {
    if (await verifyEstablishmentPin(kitchenPlain, existing.adminPin)) {
      return NextResponse.json(
        { error: "Les codes admin et cuisine doivent être différents." },
        { status: 400 },
      );
    }
  }

  const pinsTouched = adminPlain !== null || kitchenPlain !== null;

  try {
    const data: {
      name: string;
      slug: string;
      adminPin?: string;
      kitchenPin?: string;
      accessCredentialRevision?: { increment: number };
    } = {
      name: nextName,
      slug: nextSlug,
    };

    if (adminPlain !== null) {
      data.adminPin = await hashEstablishmentPin(adminPlain);
    }
    if (kitchenPlain !== null) {
      data.kitchenPin = await hashEstablishmentPin(kitchenPlain);
    }
    if (pinsTouched) {
      data.accessCredentialRevision = { increment: 1 };
    }

    await db.establishment.update({
      where: { id: establishmentId },
      data,
    });

    const fresh = await db.establishment.findUnique({
      where: { id: establishmentId },
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
      },
    });
    if (!fresh) {
      return NextResponse.json({ error: "Établissement introuvable." }, { status: 404 });
    }

    const pinChanges: { adminPin?: string; kitchenPin?: string } = {};
    if (adminPlain !== null) pinChanges.adminPin = adminPlain;
    if (kitchenPlain !== null) pinChanges.kitchenPin = kitchenPlain;

    return NextResponse.json({
      establishment: fresh,
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
