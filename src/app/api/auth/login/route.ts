import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { signEstablishmentSession, type EstablishmentRole } from "@/server/auth";
import {
  applyEstablishmentLoginCookies,
  parseCookieHeader,
  parseEstablishmentSessionsCookie,
  ESTABLISHMENT_SESSIONS_COOKIE_NAME,
} from "@/server/auth-cookies";
import { normalizeEstablishmentPin } from "@/lib/platformEstablishment";
import { normalizeEstablishmentSlug } from "@/lib/establishmentSlug";
import { db } from "@/server/db";
import { z } from "zod";

const BodySchema = z.object({
  pin: z.string().min(1),
  slug: z.string().min(1).max(64),
  next: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    if (!process.env.SESSION_SECRET?.trim()) {
      return NextResponse.json(
        {
          error:
            "SESSION_SECRET manquant dans .env : ajoutez une chaîne longue et aléatoire, enregistrez le fichier puis redémarrez « npm run dev ».",
        },
        { status: 500 },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Code ou établissement invalide." },
        { status: 400 },
      );
    }

    const slug = normalizeEstablishmentSlug(parsed.data.slug);
    if (slug.length < 2) {
      return NextResponse.json(
        { error: "Code établissement invalide." },
        { status: 400 },
      );
    }

    const establishment = await db.establishment.findUnique({
      where: { slug },
      select: {
        id: true,
        adminPin: true,
        kitchenPin: true,
        accessCredentialRevision: true,
      },
    });
    if (!establishment) {
      return NextResponse.json(
        { error: "Établissement inconnu (vérifiez le code)." },
        { status: 401 },
      );
    }

    const pin = normalizeEstablishmentPin(parsed.data.pin);
    if (pin.length === 0) {
      return NextResponse.json(
        { error: "Le code accès doit contenir des chiffres." },
        { status: 400 },
      );
    }

    const adminPin = normalizeEstablishmentPin(establishment.adminPin);
    const kitchenPin = normalizeEstablishmentPin(establishment.kitchenPin);

    let role: EstablishmentRole | null = null;
    if (pin === adminPin) role = "ADMIN";
    else if (pin === kitchenPin) role = "KITCHEN";

    if (!role) {
      return NextResponse.json({ error: "Code incorrect." }, { status: 401 });
    }

    const token = await signEstablishmentSession({
      kind: "establishment",
      role,
      establishmentId: establishment.id,
      accessCredentialRevision: establishment.accessCredentialRevision,
    });

    const redirectTo = parsed.data.next?.startsWith("/")
      ? parsed.data.next
      : "/service";

    const res = NextResponse.json({ redirectTo });
    const cookieJar = parseCookieHeader(req.headers.get("cookie") ?? "");
    const existingMap = parseEstablishmentSessionsCookie(
      cookieJar[ESTABLISHMENT_SESSIONS_COOKIE_NAME],
    );
    applyEstablishmentLoginCookies(res, establishment.id, token, existingMap);
    return res;
  } catch (e) {
    console.error("[auth/login]", e);
    const dev = process.env.NODE_ENV === "development";

    if (e instanceof Error && e.message.includes("SESSION_SECRET")) {
      return NextResponse.json(
        {
          error:
            "SESSION_SECRET invalide côté serveur — vérifiez .env et redémarrez le serveur.",
        },
        { status: 500 },
      );
    }

    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          error: dev
            ? `Base inaccessible : ${e.message.slice(0, 200)}`
            : "Impossible de joindre la base de données (DATABASE_URL).",
        },
        { status: 500 },
      );
    }

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          error: dev
            ? `Erreur Prisma ${e.code} : ${e.message}`
            : "Erreur base de données à la connexion.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: dev
          ? `Erreur serveur : ${e instanceof Error ? e.message : String(e)}`
          : "Erreur serveur à la connexion. Vérifiez DATABASE_URL et SESSION_SECRET.",
      },
      { status: 500 },
    );
  }
}
