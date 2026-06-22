import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  applyLegacyMigrationCookies,
  clearLegacySessionCookie,
  ESTABLISHMENT_SESSIONS_COOKIE_NAME,
  LEGACY_SESSION_COOKIE_NAME,
  PLATFORM_SESSION_COOKIE_NAME,
  readActiveEstablishmentToken,
  readPlatformTokenFromCookies,
} from "@/server/auth-cookies";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

type SessionKind = "establishment" | "platform" | null;

async function verifyTokenKind(token: string): Promise<SessionKind> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.kind === "platform") return "platform";
    const role = payload.role;
    const establishmentId = payload.establishmentId;
    if (
      (role === "ADMIN" || role === "KITCHEN") &&
      typeof establishmentId === "string" &&
      establishmentId.length > 0
    ) {
      return "establishment";
    }
    return null;
  } catch {
    return null;
  }
}

async function readSessionKind(req: NextRequest): Promise<SessionKind> {
  const getCookie = (name: string) => req.cookies.get(name)?.value;

  const platformToken = readPlatformTokenFromCookies(getCookie);
  if (platformToken) {
    const kind = await verifyTokenKind(platformToken);
    if (kind === "platform") return "platform";
  }

  const active = readActiveEstablishmentToken(getCookie);
  if (active) {
    const kind = await verifyTokenKind(active.token);
    if (kind === "establishment") return "establishment";
  }

  const legacy = getCookie(LEGACY_SESSION_COOKIE_NAME);
  if (legacy) return verifyTokenKind(legacy);

  return null;
}

async function migrateLegacySessionCookie(
  req: NextRequest,
  res: NextResponse,
): Promise<NextResponse> {
  const legacy = req.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value;
  if (!legacy) return res;

  const hasNewSessions =
    req.cookies.get(ESTABLISHMENT_SESSIONS_COOKIE_NAME)?.value ||
    req.cookies.get(PLATFORM_SESSION_COOKIE_NAME)?.value;

  if (hasNewSessions) {
    clearLegacySessionCookie(res);
    return res;
  }

  try {
    const { payload } = await jwtVerify(legacy, getSecret());
    if (payload.kind === "platform") {
      applyLegacyMigrationCookies(res, "platform", legacy);
      return res;
    }

    const role = payload.role;
    const establishmentId = payload.establishmentId;
    if (
      (role === "ADMIN" || role === "KITCHEN") &&
      typeof establishmentId === "string" &&
      establishmentId.length > 0
    ) {
      applyLegacyMigrationCookies(res, "establishment", legacy, establishmentId);
      return res;
    }
  } catch {
    clearLegacySessionCookie(res);
  }

  return res;
}

const PUBLIC_FILE = /\.(png|jpe?g|gif|webp|svg|ico|csv|woff2?)$/i;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images/") ||
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/establishments") ||
    pathname === "/login" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const kind = await readSessionKind(req);

  if (pathname.startsWith("/platform")) {
    if (pathname === "/platform/login") {
      if (kind === "platform") {
        const url = req.nextUrl.clone();
        url.pathname = "/platform/establishments";
        const res = NextResponse.redirect(url);
        return migrateLegacySessionCookie(req, res);
      }
      const res = NextResponse.next();
      return migrateLegacySessionCookie(req, res);
    }
    if (kind !== "platform") {
      const url = req.nextUrl.clone();
      url.pathname = "/platform/login";
      const res = NextResponse.redirect(url);
      return migrateLegacySessionCookie(req, res);
    }
    const res = NextResponse.next();
    return migrateLegacySessionCookie(req, res);
  }

  if (pathname.startsWith("/api/platform")) {
    if (kind !== "platform") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const res = NextResponse.next();
    return migrateLegacySessionCookie(req, res);
  }

  if (kind === "establishment") {
    const res = NextResponse.next();
    return migrateLegacySessionCookie(req, res);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  const res = NextResponse.redirect(url);
  return migrateLegacySessionCookie(req, res);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
