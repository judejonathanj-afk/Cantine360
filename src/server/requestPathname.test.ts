import { describe, expect, it } from "vitest";
import { pathnameFromHeaders } from "./requestPathname";

describe("pathnameFromHeaders", () => {
  it("prend x-pathname en priorité", () => {
    const h = new Headers({
      "x-pathname": "/admin/dashboard",
      "next-url": "/dashboard",
    });
    expect(pathnameFromHeaders(h)).toBe("/admin/dashboard");
  });

  it("retombe sur next-url si x-pathname manque", () => {
    const h = new Headers({ "next-url": "/admin/dashboard?days=7" });
    expect(pathnameFromHeaders(h)).toBe("/admin/dashboard");
  });

  it("extrait le chemin d’une URL absolue", () => {
    const h = new Headers({
      "next-url": "https://cantine360.vercel.app/admin/students",
    });
    expect(pathnameFromHeaders(h)).toBe("/admin/students");
  });

  it("ignore une valeur vide", () => {
    expect(pathnameFromHeaders(new Headers())).toBe("");
  });
});
