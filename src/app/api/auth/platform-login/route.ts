import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  signPlatformSession,
} from "@/server/auth";

const BodySchema = z.object({
  pin: z.string().min(1),
});

function normalizePin(raw: string) {
  return raw.replace(/\D/g, "");
}

export async function POST(req: Request) {
  const expected = process.env.PLATFORM_PIN?.replace(/\D/g, "") ?? "";
  if (expected.length < 6) {
    return NextResponse.json(
      {
        error:
          "Plateforme non configurée : définissez PLATFORM_PIN (6 chiffres minimum) dans .env.",
      },
      { status: 500 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Code invalide." }, { status: 400 });
  }

  const pin = normalizePin(parsed.data.pin);
  if (pin !== expected) {
    return NextResponse.json({ error: "Code plateforme incorrect." }, { status: 401 });
  }

  const token = await signPlatformSession();
  const res = NextResponse.json({ redirectTo: "/platform/establishments" });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
