import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionToken, type EstablishmentRole } from "@/server/auth";
import {
  applyEstablishmentLogoutCookies,
  applyEstablishmentRoleLogoutCookies,
  parseCookieHeader,
  parseEstablishmentSessionSlotKey,
  readEstablishmentSessionsFromCookies,
} from "@/server/auth-cookies";

const BodySchema = z.object({
  role: z.enum(["ADMIN", "KITCHEN"]),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const res = NextResponse.json({ ok: true });
    applyEstablishmentLogoutCookies(res);
    return res;
  }

  const role: EstablishmentRole = parsed.data.role;
  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookieMap = parseCookieHeader(cookieHeader);
  const getCookie = (name: string) => cookieMap[name];
  const { map, activeEstablishmentId: activeSlot } =
    readEstablishmentSessionsFromCookies(getCookie);

  let establishmentId: string | null = null;
  for (const [key, token] of Object.entries(map)) {
    const slot = parseEstablishmentSessionSlotKey(key);
    if (slot.role === role) {
      establishmentId = slot.establishmentId;
      break;
    }
    if (slot.role == null) {
      const session = await verifySessionToken(token);
      if (session?.kind === "establishment" && session.role === role) {
        establishmentId = session.establishmentId;
        break;
      }
    }
  }

  const res = NextResponse.json({ ok: true });
  if (!establishmentId) {
    applyEstablishmentLogoutCookies(res);
    return res;
  }

  applyEstablishmentRoleLogoutCookies(
    res,
    map,
    establishmentId,
    role,
    activeSlot,
  );
  return res;
}
