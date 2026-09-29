import { NextResponse } from "next/server";
import { applyEstablishmentLogoutCookies } from "@/server/auth-cookies";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  applyEstablishmentLogoutCookies(res);
  return res;
}
