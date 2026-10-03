import { describe, expect, it } from "vitest";

/** Miroir de la logique de redirection post-login (api/auth/login). */
function loginRedirectTo(
  role: "ADMIN" | "KITCHEN",
  requestedNext?: string,
): string {
  const defaultHome = role === "ADMIN" ? "/dashboard" : "/service";
  const nextLooksSafe =
    typeof requestedNext === "string" &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//");
  const nextOpensService =
    typeof requestedNext === "string" &&
    (requestedNext === "/service" || requestedNext.startsWith("/service/"));
  if (nextLooksSafe && !(role === "ADMIN" && nextOpensService)) {
    return requestedNext!;
  }
  return defaultHome;
}

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
  it("envoie l’admin sur /dashboard sans next", () => {
    expect(loginRedirectTo("ADMIN")).toBe("/dashboard");
  });

  it("envoie la cuisine sur /service sans next", () => {
    expect(loginRedirectTo("KITCHEN")).toBe("/service");
  });

  it("respecte un next explicite hors cuisine", () => {
    expect(loginRedirectTo("ADMIN", "/admin/students")).toBe("/admin/students");
  });

  it("n’ouvre pas la cuisine pour l’admin via next", () => {
    expect(loginRedirectTo("ADMIN", "/service")).toBe("/dashboard");
    expect(loginRedirectTo("ADMIN", "/service/abc123")).toBe("/dashboard");
    expect(loginRedirectTo("ADMIN", "/service/abc123/menu")).toBe("/dashboard");
  });

  it("laisse la cuisine reprendre un service via next", () => {
    expect(loginRedirectTo("KITCHEN", "/service/abc123/menu")).toBe(
      "/service/abc123/menu",
    );
  });

  it("ignore un next open-redirect", () => {
    expect(loginRedirectTo("ADMIN", "//evil.example")).toBe("/dashboard");
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