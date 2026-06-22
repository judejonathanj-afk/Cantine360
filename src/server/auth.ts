import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import {
  ACTIVE_ESTABLISHMENT_COOKIE_NAME,
  ESTABLISHMENT_SESSIONS_COOKIE_NAME,
  LEGACY_SESSION_COOKIE_NAME,
  PLATFORM_SESSION_COOKIE_NAME,
  readActiveEstablishmentToken,
  readPlatformTokenFromCookies,
  SESSION_COOKIE_NAME,
  type EstablishmentSessionsMap,
} from "@/server/auth-cookies";

export type EstablishmentRole = "ADMIN" | "KITCHEN";

export type EstablishmentSession = {
  kind: "establishment";
  role: EstablishmentRole;
  establishmentId: string;
  accessCredentialRevision: number;
};

export type PlatformSession = {
  kind: "platform";
};

export type Session = EstablishmentSession | PlatformSession;

export {
  SESSION_COOKIE_NAME,
  PLATFORM_SESSION_COOKIE_NAME,
  ESTABLISHMENT_SESSIONS_COOKIE_NAME,
  ACTIVE_ESTABLISHMENT_COOKIE_NAME,
} from "@/server/auth-cookies";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signEstablishmentSession(session: EstablishmentSession) {
  return await new SignJWT({
    kind: "establishment",
    role: session.role,
    establishmentId: session.establishmentId,
    accessCredentialRevision: session.accessCredentialRevision,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function signPlatformSession() {
  return await new SignJWT({ kind: "platform" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const kind = payload.kind;

    if (kind === "platform") {
      return { kind: "platform" };
    }

    if (kind === "establishment") {
      const role = payload.role;
      const establishmentId = payload.establishmentId;
      if (role !== "ADMIN" && role !== "KITCHEN") return null;
      if (typeof establishmentId !== "string" || establishmentId.length === 0)
        return null;
      const rev = payload.accessCredentialRevision;
      const accessCredentialRevision =
        typeof rev === "number" && Number.isFinite(rev) ? rev : 0;
      return {
        kind: "establishment",
        role,
        establishmentId,
        accessCredentialRevision,
      };
    }

    // Sessions émises avant `kind` / `accessCredentialRevision` (compat.)
    const role = payload.role;
    const establishmentId = payload.establishmentId;
    if (role !== "ADMIN" && role !== "KITCHEN") return null;
    if (typeof establishmentId !== "string" || establishmentId.length === 0)
      return null;
    return {
      kind: "establishment",
      role,
      establishmentId,
      accessCredentialRevision: 0,
    };
  } catch {
    return null;
  }
}

async function establishmentSessionStillValid(
  session: EstablishmentSession,
): Promise<boolean> {
  const row = await db.establishment.findUnique({
    where: { id: session.establishmentId },
    select: { accessCredentialRevision: true },
  });
  if (!row) return false;
  return row.accessCredentialRevision === session.accessCredentialRevision;
}

async function readLegacyEstablishmentToken(
  getCookie: (name: string) => string | undefined,
): Promise<{ establishmentId: string; token: string } | null> {
  const legacy = getCookie(LEGACY_SESSION_COOKIE_NAME);
  if (!legacy) return null;
  const session = await verifySessionToken(legacy);
  if (!session || session.kind !== "establishment") return null;
  return { establishmentId: session.establishmentId, token: legacy };
}

async function readEstablishmentToken(
  getCookie: (name: string) => string | undefined,
): Promise<{ establishmentId: string; token: string } | null> {
  const active = readActiveEstablishmentToken(getCookie);
  if (active) return active;
  return readLegacyEstablishmentToken(getCookie);
}

/** Session établissement (cuisine / admin cantine) — usage courant dans l’app. */
export async function getEstablishmentSession(): Promise<EstablishmentSession | null> {
  const jar = await cookies();
  const getCookie = (name: string) => jar.get(name)?.value;

  const active = await readEstablishmentToken(getCookie);
  if (!active) return null;

  const session = await verifySessionToken(active.token);
  if (!session || session.kind !== "establishment") return null;
  if (session.establishmentId !== active.establishmentId) return null;

  const valid = await establishmentSessionStillValid(session);
  return valid ? session : null;
}

/** @deprecated Alias — préférer `getEstablishmentSession`. */
export const getServerSession = getEstablishmentSession;

export async function getPlatformSession(): Promise<PlatformSession | null> {
  const jar = await cookies();
  const getCookie = (name: string) => jar.get(name)?.value;

  let token = readPlatformTokenFromCookies(getCookie);
  if (!token) {
    const legacy = getCookie(LEGACY_SESSION_COOKIE_NAME);
    if (legacy) {
      const session = await verifySessionToken(legacy);
      if (session?.kind === "platform") token = legacy;
    }
  }
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session || session.kind !== "platform") return null;
  return session;
}

/** @deprecated Préférer `getEstablishmentSession` ou `getPlatformSession`. */
export async function getSession(): Promise<Session | null> {
  const establishment = await getEstablishmentSession();
  if (establishment) return establishment;
  return await getPlatformSession();
}

/** @deprecated Utiliser les helpers dans `auth-cookies.ts` depuis les routes API. */
export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(LEGACY_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** @deprecated Utiliser `applyEstablishmentLogoutCookies` ou `applyPlatformLogoutCookies`. */
export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(LEGACY_SESSION_COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
  jar.set(ESTABLISHMENT_SESSIONS_COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
  jar.set(ACTIVE_ESTABLISHMENT_COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
  jar.set(PLATFORM_SESSION_COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
}

/** Connexion cantine (admin / cuisine d’un établissement). */
export async function signSession(session: EstablishmentSession) {
  return signEstablishmentSession(session);
}

export type { EstablishmentSessionsMap };
