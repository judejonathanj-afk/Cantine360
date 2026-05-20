import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

/** Réponse JSON pour les échecs Prisma sur les routes plateforme. */
export function platformDbErrorResponse(
  e: unknown,
  context: string,
): NextResponse {
  console.error(context, e);

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ce code établissement existe déjà." },
        { status: 409 },
      );
    }
    if (e.code === "P2021" || e.code === "P2022") {
      return NextResponse.json(
        {
          error:
            "Schéma base incomplet — lancez les migrations Prisma sur Supabase (`npx prisma migrate deploy`).",
        },
        { status: 500 },
      );
    }
  }

  if (e instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error:
          "Connexion base impossible — sur Vercel, utilisez l’URL pooler Supabase (port 6543) dans DATABASE_URL.",
      },
      { status: 500 },
    );
  }

  const dev = process.env.NODE_ENV === "development";
  const detail =
    dev && e instanceof Error ? e.message.slice(0, 240) : undefined;

  return NextResponse.json(
    {
      error:
        "Erreur base de données à l’enregistrement. Vérifiez DATABASE_URL sur Vercel (même projet Supabase que en local).",
      ...(detail ? { detail } : {}),
    },
    { status: 500 },
  );
}
