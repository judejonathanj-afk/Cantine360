import { NextResponse } from "next/server";
import { applyEstablishmentLogoutCookies, parseCookieHeader } from "@/server/auth-cookies";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true });
  const cookieJar = parseCookieHeader(req.headers.get("cookie") ?? "");
  applyEstablishmentLogoutCookies(res, (name) => cookieJar[name]);
  return res;
}
