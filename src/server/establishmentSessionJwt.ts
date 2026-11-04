import { SignJWT, decodeJwt, jwtVerify } from "jose";

export type EstablishmentSessionPayload = {
  kind: "establishment";
  role: "ADMIN" | "KITCHEN";
  establishmentId: string;
  accessCredentialRevision: number;
};

/** Durée du jeton cuisine (renouvelé tant que l’app est utilisée). */
export const ESTABLISHMENT_JWT_TTL = "30d";
export const ESTABLISHMENT_JWT_TTL_SEC = 60 * 60 * 24 * 30;

/** Session admin : 24 h depuis la connexion, sans glissement. */
export const ESTABLISHMENT_ADMIN_JWT_TTL = "24h";
export const ESTABLISHMENT_ADMIN_JWT_TTL_SEC = 60 * 60 * 24;

/** Tolérance d’horloge (évite une déconnexion trop tôt). */
export const JWT_CLOCK_TOLERANCE_SEC = 120;

/** Renouveler la cuisine si expiration dans moins de 14 jours. */
export const ESTABLISHMENT_JWT_REFRESH_WITHIN_SEC = 60 * 60 * 24 * 14;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signEstablishmentSessionJwt(
  session: EstablishmentSessionPayload,
): Promise<string> {
  return await new SignJWT({
    kind: "establishment",
    role: session.role,
    establishmentId: session.establishmentId,
    accessCredentialRevision: session.accessCredentialRevision,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) +
        (session.role === "ADMIN"
          ? ESTABLISHMENT_ADMIN_JWT_TTL_SEC
          : ESTABLISHMENT_JWT_TTL_SEC),
    )
    .sign(getSecret());
}

/** Secondes restantes avant exp (null si illisible). */
export function secondsUntilJwtExpiry(token: string): number | null {
  try {
    const payload = decodeJwt(token);
    if (typeof payload.exp !== "number") return null;
    return payload.exp - Math.floor(Date.now() / 1000);
  } catch {
    return null;
  }
}

export function establishmentJwtShouldRefresh(
  token: string,
  withinSec: number = ESTABLISHMENT_JWT_REFRESH_WITHIN_SEC,
): boolean {
  try {
    const payload = decodeJwt(token);
    if (payload.role === "ADMIN") return false;
    const exp = payload.exp;
    if (typeof exp !== "number") return true;
    return exp * 1000 - Date.now() < withinSec * 1000;
  } catch {
    return true;
  }
}

export async function verifyEstablishmentJwt(
  token: string,
): Promise<EstablishmentSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      clockTolerance: JWT_CLOCK_TOLERANCE_SEC,
    });
    if (payload.kind !== "establishment") return null;
    const role = payload.role;
    const establishmentId = payload.establishmentId;
    if (role !== "ADMIN" && role !== "KITCHEN") return null;
    if (typeof establishmentId !== "string" || establishmentId.length === 0) {
      return null;
    }
    const rev = payload.accessCredentialRevision;
    const accessCredentialRevision =
      typeof rev === "number" && Number.isFinite(rev) ? rev : 0;
    if (role === "ADMIN") {
      const iat = payload.iat;
      if (typeof iat === "number" && Date.now() / 1000 - iat > 60 * 60 * 24) {
        return null;
      }
    }
    return {
      kind: "establishment",
      role,
      establishmentId,
      accessCredentialRevision,
    };
  } catch {
    return null;
  }
}
