import { describe, expect, it } from "vitest";
import {
  loginRedirectTo,
  unauthenticatedPathRedirect,
} from "@/lib/loginRedirect";
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
  it("n’envoie jamais une URL admin vers le service cuisine", () => {
    expect(
      unauthenticatedPathRedirect("/admin/dashboard", false, true),
    ).toBeNull();
    expect(
      unauthenticatedPathRedirect("/admin/groups", false, true),
    ).toBeNull();
    expect(
      unauthenticatedPathRedirect("/antigaspillage", true, true),
    ).toBeNull();
  });

  it("renvoie l’admin seul hors d’une URL cuisine vers le dashboard admin", () => {
    expect(
      unauthenticatedPathRedirect("/service", true, false),
    ).toBe("/admin/dashboard");
    expect(
      unauthenticatedPathRedirect("/dashboard", true, false),
    ).toBe("/admin/dashboard");
  });

  it("laisse la cuisine ouvrir /service si les deux sessions existent", () => {
    expect(
      unauthenticatedPathRedirect("/service", true, true),
    ).toBeNull();
  });
});

describe("shellRoleForPathname", () => {
  it("garde le chrome admin sur les URLs admin même si le jeton lu est cuisine", () => {
    expect(shellRoleForPathname("/admin/dashboard", "KITCHEN")).toBe("ADMIN");
    expect(shellRoleForPathname("/admin/groups", "ADMIN")).toBe("ADMIN");
  });

  it("ne montre pas Service à un compte admin", () => {
    expect(shellRoleForPathname("/service", "ADMIN")).toBe("ADMIN");
    expect(shellRoleForPathname("/dashboard", "ADMIN")).toBe("ADMIN");
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
