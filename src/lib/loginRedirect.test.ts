import { describe, expect, it } from "vitest";
import { loginQueryForRedirect } from "@/lib/loginRedirect";

describe("loginQueryForRedirect", () => {
  it("ajoute reason=expired quand une session existait", () => {
    const q = loginQueryForRedirect({
      next: "/admin/groups",
      hadEstablishmentSession: true,
    });
    expect(q).toContain("reason=expired");
    expect(q).toContain("next=%2Fadmin%2Fgroups");
  });

  it("n’ajoute pas expired sans cookies session", () => {
    expect(
      loginQueryForRedirect({ hadEstablishmentSession: false }),
    ).toBe("");
  });
});
