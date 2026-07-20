import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { normalizeEstablishmentPin } from "@/lib/platformEstablishment";

const scryptAsync = promisify(scrypt);

/** Préfixe des codes stockés hashés (scrypt). Les anciennes valeurs en clair restent acceptées au login. */
export const PIN_HASH_PREFIX = "scrypt$";

const KEY_LEN = 32;

export function isHashedPin(stored: string): boolean {
  return stored.startsWith(PIN_HASH_PREFIX);
}

export async function hashEstablishmentPin(rawPin: string): Promise<string> {
  const pin = normalizeEstablishmentPin(rawPin);
  if (pin.length < 4) {
    throw new Error("PIN trop court pour le hash.");
  }
  const salt = randomBytes(16);
  const derived = (await scryptAsync(pin, salt, KEY_LEN)) as Buffer;
  return `${PIN_HASH_PREFIX}${salt.toString("hex")}$${derived.toString("hex")}`;
}

/**
 * Vérifie un code saisi contre la valeur en base (hash scrypt ou ancien clair).
 */
export async function verifyEstablishmentPin(
  rawPin: string,
  stored: string,
): Promise<boolean> {
  const pin = normalizeEstablishmentPin(rawPin);
  if (!pin || !stored) return false;

  if (!isHashedPin(stored)) {
    const legacy = normalizeEstablishmentPin(stored);
    if (legacy.length === 0 || legacy.length !== pin.length) return false;
    return timingSafeEqual(Buffer.from(pin), Buffer.from(legacy));
  }

  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1] ?? "", "hex");
  const expected = Buffer.from(parts[2] ?? "", "hex");
  if (salt.length !== 16 || expected.length !== KEY_LEN) return false;

  const derived = (await scryptAsync(pin, salt, KEY_LEN)) as Buffer;
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
