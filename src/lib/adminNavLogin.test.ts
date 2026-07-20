import { describe, expect, it } from "vitest";

/** Miroir de la logique de redirection post-login (api/auth/login). */
function loginRedirectTo(
  role: "ADMIN" | "KITCHEN",
  requestedNext?: string,
): string {
  const defaultHome = role === "ADMIN" ? "/dashboard" : "/service";
  return requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : defaultHome;
}

/** Miroir de l’ordre de nav admin (AppShell). */
function adminNavLabels(hasActiveService: boolean): string[] {
  const serviceItems = hasActiveService
    ? ["Menu & allergènes", "Service"]
    : ["Service"];
  return [
    "Dashboard",
    "Écoles & classes",
    "Élèves & allergènes",
    ...serviceItems,
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

  it("respecte un next explicite (deep link)", () => {
    expect(loginRedirectTo("ADMIN", "/admin/students")).toBe("/admin/students");
    expect(loginRedirectTo("ADMIN", "/service")).toBe("/service");
  });

  it("ignore un next open-redirect", () => {
    expect(loginRedirectTo("ADMIN", "//evil.example")).toBe("/dashboard");
  });
});

describe("admin nav order", () => {
  it("place Service après Élèves & allergènes", () => {
    const labels = adminNavLabels(false);
    expect(labels.indexOf("Élèves & allergènes")).toBeLessThan(labels.indexOf("Service"));
    expect(labels).toEqual([
      "Dashboard",
      "Écoles & classes",
      "Élèves & allergènes",
      "Service",
      "Exports",
    ]);
  });

  it("garde Menu puis Service après Élèves quand un service est ouvert", () => {
    expect(adminNavLabels(true)).toEqual([
      "Dashboard",
      "Écoles & classes",
      "Élèves & allergènes",
      "Menu & allergènes",
      "Service",
      "Exports",
    ]);
  });
});
