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

/** Plafond de sessions établissement dans le cookie (évite dépassement ~4 Ko navigateur). */
export const MAX_ESTABLISHMENT_SESSIONS = 5;

/**
 * Garde au plus `max` sessions ; `keepId` est toujours conservé.
 * Les autres sont évincées dans l’ordre d’insertion (les plus anciennes d’abord).
 */
export function pruneEstablishmentSessionsMap(
  map: EstablishmentSessionsMap,
  keepId: string,
  max: number = MAX_ESTABLISHMENT_SESSIONS,
): EstablishmentSessionsMap {
  const next: EstablishmentSessionsMap = { ...map };
  if (!keepId || max < 1) return next;

  const others = Object.keys(next).filter((id) => id !== keepId);
  while (others.length >= max) {
    const drop = others.shift();
    if (!drop) break;
    delete next[drop];
  }
  return next;
}

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
): void {
  // Une seule session active. Garder un ancien jeton admin à côté du jeton
  // cuisine faisait repasser le navigateur en admin plus tard.
  const map: EstablishmentSessionsMap = {
    [establishmentId]: token,
  };
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

export function applyEstablishmentLogoutCookies(res: NextResponse): void {
  clearEstablishmentSessionCookies(res);
  clearLegacySessionCookie(res);
}

/**
 * Ne pas réutiliser l’ancien cookie `c360_session` s’il reste un pointeur
 * de session établissement : cet ancien cookie est souvent un admin.
 */
export function hasEstablishmentSessionPointer(
  getCookie: (name: string) => string | undefined,
): boolean {
  const activeId = getCookie(ACTIVE_ESTABLISHMENT_COOKIE_NAME);
  const sessions = getCookie(ESTABLISHMENT_SESSIONS_COOKIE_NAME);
  return Boolean(activeId || sessions);
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
