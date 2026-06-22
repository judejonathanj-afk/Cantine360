import { NextResponse } from "next/server";
import { applyPlatformLogoutCookies } from "@/server/auth-cookies";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  applyPlatformLogoutCookies(res);
  return res;
}
