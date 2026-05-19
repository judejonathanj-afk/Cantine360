import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/server/db";

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

export const SESSION_COOKIE_NAME = "c360_session";

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

async function verifySessionToken(token: string): Promise<Session | null> {
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

/** Session établissement (cuisine / admin cantine) — usage courant dans l’app. */
export async function getEstablishmentSession(): Promise<EstablishmentSession | null> {
  const session = await getSession();
  if (!session || session.kind !== "establishment") return null;
  const valid = await establishmentSessionStillValid(session);
  return valid ? session : null;
}

/** @deprecated Alias — préférer `getEstablishmentSession`. */
export const getServerSession = getEstablishmentSession;

export async function getPlatformSession(): Promise<PlatformSession | null> {
  const session = await getSession();
  if (!session || session.kind !== "platform") return null;
  return session;
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
}

/** Connexion cantine (admin / cuisine d’un établissement). */
export async function signSession(session: EstablishmentSession) {
  return signEstablishmentSession(session);
}
