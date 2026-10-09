import type { NextResponse } from "next/server";

/** @deprecated Ancien cookie unique — migré automatiquement vers les cookies dédiés. */
export const LEGACY_SESSION_COOKIE_NAME = "c360_session";

export const PLATFORM_SESSION_COOKIE_NAME = "c360_platform_session";
export const ESTABLISHMENT_SESSIONS_COOKIE_NAME = "c360_establishment_sessions";
export const ACTIVE_ESTABLISHMENT_COOKIE_NAME = "c360_active_establishment";

/** Alias historique — préférer les constantes dédiées ci-dessus. */
export const SESSION_COOKIE_NAME = LEGACY_SESSION_COOKIE_NAME;

export type EstablishmentSessionsMap = Record<string, string>;

export type EstablishmentRole = "ADMIN" | "KITCHEN";

/** Clé de session : un jeton admin et un jeton cuisine par établissement. */
export function establishmentSessionSlotKey(
  establishmentId: string,
  role: EstablishmentRole,
): string {
  return `${establishmentId}:${role}`;
}

export function parseEstablishmentSessionSlotKey(key: string): {
  establishmentId: string;
  role: EstablishmentRole | null;
} {
  const sep = key.lastIndexOf(":");
  if (sep <= 0) return { establishmentId: key, role: null };
  const establishmentId = key.slice(0, sep);
  const suffix = key.slice(sep + 1);
  if (suffix === "ADMIN" || suffix === "KITCHEN") {
    return { establishmentId, role: suffix };
  }
  return { establishmentId: key, role: null };
}

/** Rôle attendu pour la page — permet admin + cuisine en parallèle (onglets). */
export function sessionRoleForPath(pathname: string): EstablishmentRole | null {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/antigaspillage") ||
    pathname.startsWith("/exports")
  ) {
    return "ADMIN";
  }
  if (pathname === "/service" || pathname.startsWith("/service/")) {
    return "KITCHEN";
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return "KITCHEN";
  }
  return null;
}

export function pickEstablishmentSessionCandidate(
  map: EstablishmentSessionsMap,
  pathname: string,
  activeSlot: string | null,
): { establishmentId: string; token: string; slotKey: string } | null {
  const wantRole = sessionRoleForPath(pathname);

  if (wantRole) {
    for (const [key, token] of Object.entries(map)) {
      if (!token) continue;
      const { establishmentId, role: keyRole } =
        parseEstablishmentSessionSlotKey(key);
      if (keyRole != null && keyRole !== wantRole) continue;
      return { establishmentId, token, slotKey: key };
    }
    return null;
  }

  if (activeSlot && map[activeSlot]) {
    const { establishmentId } = parseEstablishmentSessionSlotKey(activeSlot);
    return {
      establishmentId,
      token: map[activeSlot]!,
      slotKey: activeSlot,
    };
  }

  const first = Object.entries(map).find(([, token]) => token.length > 0);
  if (!first) return null;
  const [slotKey, token] = first;
  const { establishmentId } = parseEstablishmentSessionSlotKey(slotKey);
  return { establishmentId, token, slotKey };
}

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
  pathname = "",
): { establishmentId: string; token: string } | null {
  const { map, activeEstablishmentId: activeSlot } =
    readEstablishmentSessionsFromCookies(getCookie);
  const picked = pickEstablishmentSessionCandidate(
    map,
    pathname,
    activeSlot,
  );
  if (!picked) return null;
  return { establishmentId: picked.establishmentId, token: picked.token };
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
  role: EstablishmentRole,
  token: string,
  priorMap: EstablishmentSessionsMap = {},
): void {
  const slot = establishmentSessionSlotKey(establishmentId, role);
  const merged: EstablishmentSessionsMap = { ...priorMap, [slot]: token };
  delete merged[establishmentId];
  const map = pruneEstablishmentSessionsMap(merged, slot);
  const base = cookieBaseOptions();
  res.cookies.set(
    ESTABLISHMENT_SESSIONS_COOKIE_NAME,
    serializeEstablishmentSessionsCookie(map),
    { ...base, maxAge: ESTABLISHMENT_SESSION_MAX_AGE },
  );
  res.cookies.set(ACTIVE_ESTABLISHMENT_COOKIE_NAME, slot, {
    ...base,
    maxAge: ESTABLISHMENT_SESSION_MAX_AGE,
  });
  clearLegacySessionCookie(res);
}

export function applyEstablishmentRoleLogoutCookies(
  res: NextResponse,
  priorMap: EstablishmentSessionsMap,
  establishmentId: string,
  role: EstablishmentRole,
  activeSlot: string | null,
): void {
  const slot = establishmentSessionSlotKey(establishmentId, role);
  const next: EstablishmentSessionsMap = { ...priorMap };
  delete next[slot];
  delete next[establishmentId];

  const base = cookieBaseOptions();
  if (Object.keys(next).length === 0) {
    clearEstablishmentSessionCookies(res);
    clearLegacySessionCookie(res);
    return;
  }

  let newActive = activeSlot;
  if (!newActive || !next[newActive]) {
    newActive = Object.keys(next)[0] ?? null;
  }

  res.cookies.set(
    ESTABLISHMENT_SESSIONS_COOKIE_NAME,
    serializeEstablishmentSessionsCookie(next),
    { ...base, maxAge: ESTABLISHMENT_SESSION_MAX_AGE },
  );
  if (newActive) {
    res.cookies.set(ACTIVE_ESTABLISHMENT_COOKIE_NAME, newActive, {
      ...base,
      maxAge: ESTABLISHMENT_SESSION_MAX_AGE,
    });
  } else {
    res.cookies.set(ACTIVE_ESTABLISHMENT_COOKIE_NAME, "", { ...base, maxAge: 0 });
  }
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
