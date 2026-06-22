import type { NextResponse } from "next/server";

/** @deprecated Ancien cookie unique — migré automatiquement vers les cookies dédiés. */
export const LEGACY_SESSION_COOKIE_NAME = "c360_session";

export const PLATFORM_SESSION_COOKIE_NAME = "c360_platform_session";
export const ESTABLISHMENT_SESSIONS_COOKIE_NAME = "c360_establishment_sessions";
export const ACTIVE_ESTABLISHMENT_COOKIE_NAME = "c360_active_establishment";

/** Alias historique — préférer les constantes dédiées ci-dessus. */
export const SESSION_COOKIE_NAME = LEGACY_SESSION_COOKIE_NAME;

export type EstablishmentSessionsMap = Record<string, string>;

export const ESTABLISHMENT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
export const PLATFORM_SESSION_MAX_AGE = 60 * 60 * 12;

export function cookieBaseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function parseCookieHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header.trim()) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

export function parseEstablishmentSessionsCookie(
  value: string | undefined,
): EstablishmentSessionsMap {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const result: EstablishmentSessionsMap = {};
    for (const [key, token] of Object.entries(parsed)) {
      if (typeof key === "string" && typeof token === "string" && token.length > 0) {
        result[key] = token;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function serializeEstablishmentSessionsCookie(
  map: EstablishmentSessionsMap,
): string {
  return JSON.stringify(map);
}

export function readEstablishmentSessionsFromCookies(
  getCookie: (name: string) => string | undefined,
): { map: EstablishmentSessionsMap; activeEstablishmentId: string | null } {
  const map = parseEstablishmentSessionsCookie(
    getCookie(ESTABLISHMENT_SESSIONS_COOKIE_NAME),
  );
  const activeEstablishmentId =
    getCookie(ACTIVE_ESTABLISHMENT_COOKIE_NAME) ?? null;
  return { map, activeEstablishmentId };
}

export function readActiveEstablishmentToken(
  getCookie: (name: string) => string | undefined,
): { establishmentId: string; token: string } | null {
  const { map, activeEstablishmentId } =
    readEstablishmentSessionsFromCookies(getCookie);
  if (!activeEstablishmentId) return null;
  const token = map[activeEstablishmentId];
  if (!token) return null;
  return { establishmentId: activeEstablishmentId, token };
}

export function readPlatformTokenFromCookies(
  getCookie: (name: string) => string | undefined,
): string | null {
  const token = getCookie(PLATFORM_SESSION_COOKIE_NAME);
  return token && token.length > 0 ? token : null;
}

export function applyEstablishmentLoginCookies(
  res: NextResponse,
  establishmentId: string,
  token: string,
  existingMap: EstablishmentSessionsMap = {},
): void {
  const map: EstablishmentSessionsMap = { ...existingMap, [establishmentId]: token };
  const base = cookieBaseOptions();
  res.cookies.set(
    ESTABLISHMENT_SESSIONS_COOKIE_NAME,
    serializeEstablishmentSessionsCookie(map),
    { ...base, maxAge: ESTABLISHMENT_SESSION_MAX_AGE },
  );
  res.cookies.set(ACTIVE_ESTABLISHMENT_COOKIE_NAME, establishmentId, {
    ...base,
    maxAge: ESTABLISHMENT_SESSION_MAX_AGE,
  });
  clearLegacySessionCookie(res);
}

export function applyEstablishmentLogoutCookies(
  res: NextResponse,
  getCookie: (name: string) => string | undefined,
): void {
  const { map, activeEstablishmentId } =
    readEstablishmentSessionsFromCookies(getCookie);
  if (!activeEstablishmentId) {
    clearEstablishmentSessionCookies(res);
    return;
  }

  const nextMap = { ...map };
  delete nextMap[activeEstablishmentId];
  const remainingIds = Object.keys(nextMap);
  const base = cookieBaseOptions();

  if (remainingIds.length === 0) {
    clearEstablishmentSessionCookies(res);
    return;
  }

  res.cookies.set(
    ESTABLISHMENT_SESSIONS_COOKIE_NAME,
    serializeEstablishmentSessionsCookie(nextMap),
    { ...base, maxAge: ESTABLISHMENT_SESSION_MAX_AGE },
  );

  const nextActive = remainingIds[0]!;
  res.cookies.set(ACTIVE_ESTABLISHMENT_COOKIE_NAME, nextActive, {
    ...base,
    maxAge: ESTABLISHMENT_SESSION_MAX_AGE,
  });
}

export function clearEstablishmentSessionCookies(res: NextResponse): void {
  const base = cookieBaseOptions();
  res.cookies.set(ESTABLISHMENT_SESSIONS_COOKIE_NAME, "", { ...base, maxAge: 0 });
  res.cookies.set(ACTIVE_ESTABLISHMENT_COOKIE_NAME, "", { ...base, maxAge: 0 });
}

export function applyPlatformLoginCookies(res: NextResponse, token: string): void {
  const base = cookieBaseOptions();
  res.cookies.set(PLATFORM_SESSION_COOKIE_NAME, token, {
    ...base,
    maxAge: PLATFORM_SESSION_MAX_AGE,
  });
  clearLegacySessionCookie(res);
}

export function applyPlatformLogoutCookies(res: NextResponse): void {
  const base = cookieBaseOptions();
  res.cookies.set(PLATFORM_SESSION_COOKIE_NAME, "", { ...base, maxAge: 0 });
}

export function clearLegacySessionCookie(res: NextResponse): void {
  const base = cookieBaseOptions();
  res.cookies.set(LEGACY_SESSION_COOKIE_NAME, "", { ...base, maxAge: 0 });
}

export function applyLegacyMigrationCookies(
  res: NextResponse,
  kind: "establishment" | "platform",
  token: string,
  establishmentId?: string,
  existingMap: EstablishmentSessionsMap = {},
): void {
  if (kind === "platform") {
    applyPlatformLoginCookies(res, token);
    return;
  }
  if (!establishmentId) return;
  applyEstablishmentLoginCookies(res, establishmentId, token, existingMap);
}
