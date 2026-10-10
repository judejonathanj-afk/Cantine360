import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import {
  ACTIVE_ESTABLISHMENT_COOKIE_NAME,
  applyEstablishmentLoginCookies,
  applyEstablishmentLogoutCookies,
  establishmentSessionSlotKey,
  ESTABLISHMENT_SESSIONS_COOKIE_NAME,
  hasEstablishmentSessionPointer,
  LEGACY_SESSION_COOKIE_NAME,
  MAX_ESTABLISHMENT_SESSIONS,
  pickEstablishmentSessionCandidate,
  pruneEstablishmentSessionsMap,
  sessionRoleForPath,
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
  it("conserve admin et cuisine pour le même établissement", () => {
    const res = NextResponse.json({ ok: true });
    applyEstablishmentLoginCookies(res, "ecole", "ADMIN", "token-admin");
    applyEstablishmentLoginCookies(
      res,
      "ecole",
      "KITCHEN",
      "token-cuisine",
      { [establishmentSessionSlotKey("ecole", "ADMIN")]: "token-admin" },
    );
    const raw = res.cookies.get(ESTABLISHMENT_SESSIONS_COOKIE_NAME)?.value;
    expect(JSON.parse(raw ?? "{}")).toEqual({
      [establishmentSessionSlotKey("ecole", "ADMIN")]: "token-admin",
      [establishmentSessionSlotKey("ecole", "KITCHEN")]: "token-cuisine",
    });
    expect(res.cookies.get(ACTIVE_ESTABLISHMENT_COOKIE_NAME)?.value).toBe(
      establishmentSessionSlotKey("ecole", "KITCHEN"),
    );
    expect(res.cookies.get(LEGACY_SESSION_COOKIE_NAME)?.value).toBe("");
  });

  it("choisit le jeton selon la page (admin vs cuisine)", () => {
    const map = {
      [establishmentSessionSlotKey("ecole", "ADMIN")]: "token-admin",
      [establishmentSessionSlotKey("ecole", "KITCHEN")]: "token-cuisine",
    };
    expect(
      pickEstablishmentSessionCandidate(map, "/admin/groups", null)?.token,
    ).toBe("token-admin");
    expect(
      pickEstablishmentSessionCandidate(map, "/service", null)?.token,
    ).toBe("token-cuisine");
    expect(sessionRoleForPath("/admin/dashboard")).toBe("ADMIN");
    expect(sessionRoleForPath("/dashboard")).toBe("KITCHEN");
    expect(sessionRoleForPath("/api/groups")).toBe("ADMIN");
    expect(sessionRoleForPath("/api/services/abc/metrics")).toBe("KITCHEN");
    expect(sessionRoleForPath("/api/services/abc/attendance/import")).toBe(
      "ADMIN",
    );
  });

  it("ignore le slot actif cuisine pour une route admin", () => {
    const map = {
      [establishmentSessionSlotKey("ecole", "ADMIN")]: "token-admin",
      [establishmentSessionSlotKey("ecole", "KITCHEN")]: "token-cuisine",
    };
    const active = establishmentSessionSlotKey("ecole", "KITCHEN");
    expect(
      pickEstablishmentSessionCandidate(map, "/api/students", active)?.token,
    ).toBe("token-admin");
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
