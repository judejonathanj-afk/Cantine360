import { hashEstablishmentPin, verifyEstablishmentPin } from "@/lib/pinHash";
import { db } from "@/server/db";

const SINGLETON_ID = "singleton";

export function normalizePlatformPin(raw: string) {
  return raw.replace(/\D/g, "");
}

export function validatePlatformPin(pin: string): string | null {
  if (pin.length < 6) {
    return "Le code plateforme doit contenir au moins 6 chiffres.";
  }
  return null;
}

export async function verifyPlatformLoginPin(pin: string): Promise<boolean> {
  const normalized = normalizePlatformPin(pin);
  if (!normalized) return false;

  try {
    const row = await db.platformSettings.findUnique({
      where: { id: SINGLETON_ID },
      select: { platformPinHash: true },
    });
    if (row?.platformPinHash) {
      return verifyEstablishmentPin(normalized, row.platformPinHash);
    }
  } catch {
    /* table absente ou DB indisponible — repli env */
  }

  const expected = normalizePlatformPin(process.env.PLATFORM_PIN ?? "");
  return expected.length >= 6 && normalized === expected;
}

export async function platformPinSource(): Promise<"database" | "environment"> {
  try {
    const row = await db.platformSettings.findUnique({
      where: { id: SINGLETON_ID },
      select: { platformPinHash: true },
    });
    if (row?.platformPinHash) return "database";
  } catch {
    /* ignore */
  }
  return "environment";
}

export async function updatePlatformPin(currentPin: string, newPin: string) {
  const current = normalizePlatformPin(currentPin);
  const next = normalizePlatformPin(newPin);
  const pinError = validatePlatformPin(next);
  if (pinError) return { ok: false as const, error: pinError };

  const valid = await verifyPlatformLoginPin(current);
  if (!valid) {
    return { ok: false as const, error: "Code actuel incorrect." };
  }
  if (current === next) {
    return {
      ok: false as const,
      error: "Le nouveau code doit être différent de l’actuel.",
    };
  }

  const platformPinHash = await hashEstablishmentPin(next);
  await db.platformSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, platformPinHash },
    update: { platformPinHash },
  });

  return { ok: true as const };
}
