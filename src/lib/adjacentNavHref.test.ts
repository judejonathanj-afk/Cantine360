import { describe, expect, it } from "vitest";
import { adjacentNavHref } from "@/lib/adjacentNavHref";

const ADMIN = [
  {
    href: "/admin/dashboard",
    isActive: (p: string) =>
      p === "/admin/dashboard" || p.startsWith("/admin/dashboard/"),
  },
  { href: "/antigaspillage" },
  { href: "/admin/groups" },
  { href: "/admin/students" },
  { href: "/exports" },
];

describe("adjacentNavHref", () => {
  it("glisse vers la page suivante et précédente", () => {
    expect(adjacentNavHref(ADMIN, "/admin/dashboard", 1)).toBe(
      "/antigaspillage",
    );
    expect(adjacentNavHref(ADMIN, "/antigaspillage", 1)).toBe("/admin/groups");
    expect(adjacentNavHref(ADMIN, "/admin/groups", -1)).toBe("/antigaspillage");
  });

  it("ne sort pas des bords", () => {
    expect(adjacentNavHref(ADMIN, "/admin/dashboard", -1)).toBeNull();
    expect(adjacentNavHref(ADMIN, "/exports", 1)).toBeNull();
  });

  it("suit une sous-page du dashboard", () => {
    expect(adjacentNavHref(ADMIN, "/admin/dashboard/lecture", 1)).toBe(
      "/antigaspillage",
    );
  });
});
