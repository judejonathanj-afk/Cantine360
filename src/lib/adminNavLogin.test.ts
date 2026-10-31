import { describe, expect, it } from "vitest";
import {
  loginRedirectTo,
  unauthenticatedPathRedirect,
} from "@/lib/loginRedirect";
import { loginRoleFromPinMatch } from "@/lib/loginRole";
import { shellRoleForPathname } from "@/lib/uiRole";

/** Miroir de l’ordre de nav admin (AppShell) : pas de Service, réservé à la cuisine. */
function adminNavLabels(): string[] {
  return [
    "Dashboard",
    "Anti-gaspillage",
    "Écoles & classes",
    "Élèves & allergènes",
    "Exports",
  ];
}

describe("admin login redirect", () => {
  it("envoie l’admin sur /admin/dashboard sans next", () => {
    expect(loginRedirectTo("ADMIN")).toBe("/admin/dashboard");
  });

  it("envoie la cuisine sur /service sans next", () => {
    expect(loginRedirectTo("KITCHEN")).toBe("/service");
  });

  it("respecte un next explicite hors cuisine", () => {
    expect(loginRedirectTo("ADMIN", "/admin/students")).toBe("/admin/students");
  });

  it("n’ouvre pas la cuisine pour l’admin via next", () => {
    expect(loginRedirectTo("ADMIN", "/service")).toBe("/admin/dashboard");
    expect(loginRedirectTo("ADMIN", "/service/abc123")).toBe("/admin/dashboard");
    expect(loginRedirectTo("ADMIN", "/service/abc123/menu")).toBe(
      "/admin/dashboard",
    );
    expect(loginRedirectTo("ADMIN", "/dashboard")).toBe("/admin/dashboard");
  });

  it("n’ouvre pas l’admin pour la cuisine via next", () => {
    expect(loginRedirectTo("KITCHEN", "/admin/groups")).toBe("/service");
    expect(loginRedirectTo("KITCHEN", "/admin/dashboard")).toBe("/service");
    expect(loginRedirectTo("KITCHEN", "/antigaspillage")).toBe("/service");
    expect(loginRedirectTo("KITCHEN", "/exports")).toBe("/service");
  });

  it("laisse la cuisine reprendre un service via next", () => {
    expect(loginRedirectTo("KITCHEN", "/service/abc123/menu")).toBe(
      "/service/abc123/menu",
    );
  });

  it("ignore un next open-redirect", () => {
    expect(loginRedirectTo("ADMIN", "//evil.example")).toBe("/admin/dashboard");
  });
});

describe("unauthenticatedPathRedirect", () => {
  it("renvoie la cuisine hors des URLs admin", () => {
    expect(
      unauthenticatedPathRedirect("/admin/dashboard", false, true),
    ).toBe("/service");
    expect(
      unauthenticatedPathRedirect("/admin/groups", false, true),
    ).toBe("/service");
  });

  it("ne mélange pas les deux sessions encore valides", () => {
    expect(
      unauthenticatedPathRedirect("/antigaspillage", true, true),
    ).toBeNull();
  });

  it("renvoie l’admin hors des URLs cuisine", () => {
    expect(
      unauthenticatedPathRedirect("/service", true, false),
    ).toBe("/admin/dashboard");
    expect(
      unauthenticatedPathRedirect("/dashboard", true, false),
    ).toBe("/admin/dashboard");
  });
});

describe("loginRoleFromPinMatch", () => {
  it("un PIN cuisine seul ouvre la cuisine", () => {
    expect(loginRoleFromPinMatch(false, true, "/admin/dashboard")).toBe(
      "KITCHEN",
    );
  });

  it("si les deux PIN matchent, next=/service ouvre la cuisine", () => {
    expect(loginRoleFromPinMatch(true, true, "/service")).toBe("KITCHEN");
    expect(loginRoleFromPinMatch(true, true, "/dashboard")).toBe("KITCHEN");
  });
});

describe("shellRoleForPathname", () => {
  it("suit le jeton, pas l’URL", () => {
    expect(shellRoleForPathname("/admin/dashboard", "KITCHEN")).toBe("KITCHEN");
    expect(shellRoleForPathname("/admin/groups", "ADMIN")).toBe("ADMIN");
    expect(shellRoleForPathname("/service", "ADMIN")).toBe("ADMIN");
    expect(shellRoleForPathname("/dashboard", "KITCHEN")).toBe("KITCHEN");
  });
});

describe("admin nav order", () => {
  it("n’affiche pas Service : la cuisine a son propre compte", () => {
    expect(adminNavLabels()).toEqual([
      "Dashboard",
      "Anti-gaspillage",
      "Écoles & classes",
      "Élèves & allergènes",
      "Exports",
    ]);
    expect(adminNavLabels()).not.toContain("Service");
  });
});
