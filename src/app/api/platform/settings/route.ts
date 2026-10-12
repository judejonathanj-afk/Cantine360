import { NextResponse } from "next/server";
import { getPlatformSession } from "@/server/auth";
import { platformPinSource } from "@/server/platformPin";

/** Aligné sur PLATFORM_SESSION_MAX_AGE (auth-cookies). */
const PLATFORM_SESSION_HOURS = 12;

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pinSource = await platformPinSource();
  const sessionHours = PLATFORM_SESSION_HOURS;

  return NextResponse.json({
    loginPath: "/platform/login",
    establishmentsPath: "/platform/establishments",
    pinSource,
    pinSourceLabel:
      pinSource === "database"
        ? "Code enregistré dans Cantine360 (modifiable ci-dessous)."
        : "Code défini sur Vercel (variable PLATFORM_PIN) — changez-le ici pour le stocker en base.",
    sessionHours,
    guardConfigured: Boolean(process.env.CANTINE_GUARD_SECRET?.trim()),
  });
}
