import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "c360_session";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

type SessionKind = "establishment" | "platform" | null;

async function readSessionKind(req: NextRequest): Promise<SessionKind> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
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
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }
    if (kind !== "platform") {
      const url = req.nextUrl.clone();
      url.pathname = "/platform/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/platform")) {
    if (kind !== "platform") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (kind === "establishment") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
