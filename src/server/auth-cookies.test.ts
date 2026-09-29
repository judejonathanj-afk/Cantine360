import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import {
  ACTIVE_ESTABLISHMENT_COOKIE_NAME,
  applyEstablishmentLoginCookies,
  applyEstablishmentLogoutCookies,
  ESTABLISHMENT_SESSIONS_COOKIE_NAME,
  hasEstablishmentSessionPointer,
  LEGACY_SESSION_COOKIE_NAME,
  MAX_ESTABLISHMENT_SESSIONS,
  pruneEstablishmentSessionsMap,
} from "@/server/auth-cookies";

describe("pruneEstablishmentSessionsMap", () => {
  it("laisse de la place pour keepId puis plafonne à max", () => {
    const map: Record<string, string> = {};
    for (let i = 0; i < MAX_ESTABLISHMENT_SESSIONS + 3; i++) {
      map[`est-${i}`] = `token-${i}`;
    }
    const pruned = pruneEstablishmentSessionsMap(map, "est-new");
    expect(Object.keys(pruned)).not.toContain("est-new");
    expect(Object.keys(pruned).length).toBe(MAX_ESTABLISHMENT_SESSIONS - 1);
    const withLogin = { ...pruned, "est-new": "token-new" };
    expect(Object.keys(withLogin)).toHaveLength(MAX_ESTABLISHMENT_SESSIONS);
    expect(withLogin["est-new"]).toBe("token-new");
  });

  it("conserve keepId déjà présent sans dépasser max", () => {
    const map = {
      a: "1",
      b: "2",
      c: "3",
      d: "4",
      e: "5",
    };
    const pruned = pruneEstablishmentSessionsMap(map, "e", 5);
    expect(pruned.e).toBe("5");
    expect(Object.keys(pruned)).toHaveLength(5);
  });
});

describe("session établissement", () => {
  it("remplace l’ancienne session au lieu de garder un admin à côté", () => {
    const res = NextResponse.json({ ok: true });
    applyEstablishmentLoginCookies(res, "ecole", "token-admin");
    applyEstablishmentLoginCookies(res, "ecole", "token-cuisine");
    const raw = res.cookies.get(ESTABLISHMENT_SESSIONS_COOKIE_NAME)?.value;
    expect(JSON.parse(raw ?? "{}")).toEqual({ ecole: "token-cuisine" });
    expect(res.cookies.get(ACTIVE_ESTABLISHMENT_COOKIE_NAME)?.value).toBe("ecole");
    expect(res.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value).toBe("");
  });

  it("déconnecte sans activer une autre session", () => {
    const res = NextResponse.json({ ok: true });
    applyEstablishmentLogoutCookies(res);
    expect(res.cookies.get(ESTABLISHMENT_SESSIONS_COOKIE_NAME)?.value).toBe("");
    expect(res.cookies.get(ACTIVE_ESTABLISHMENT_COOKIE_NAME)?.value).toBe("");
    expect(res.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value).toBe("");
  });

  it("ignore l’ancien cookie admin tant qu’une session établissement est posée", () => {
    expect(
      hasEstablishmentSessionPointer((name) =>
        name === ACTIVE_ESTABLISHMENT_COOKIE_NAME ? "ecole" : undefined,
      ),
    ).toBe(true);
    expect(hasEstablishmentSessionPointer(() => undefined)).toBe(false);
  });
});
