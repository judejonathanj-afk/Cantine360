import { SignJWT, decodeJwt, jwtVerify } from "jose";

export type EstablishmentSessionPayload = {
  kind: "establishment";
  role: "ADMIN" | "KITCHEN";
  establishmentId: string;
  accessCredentialRevision: number;
};

/** Durée du jeton établissement (renouvelé tant que l’app est utilisée). */
export const ESTABLISHMENT_JWT_TTL = "30d";

/** Renouveler si expiration dans moins de 14 jours (session laissée ouverte). */
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
    .setExpirationTime(ESTABLISHMENT_JWT_TTL)
    .sign(getSecret());
}

export function establishmentJwtShouldRefresh(
  token: string,
  withinSec: number = ESTABLISHMENT_JWT_REFRESH_WITHIN_SEC,
): boolean {
  try {
    const payload = decodeJwt(token);
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
    const { payload } = await jwtVerify(token, getSecret());
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
