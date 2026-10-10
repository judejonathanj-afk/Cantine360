import { describe, expect, it } from "vitest";
import {
  ESTABLISHMENT_JWT_REFRESH_WITHIN_SEC,
  establishmentJwtShouldRefresh,
  signEstablishmentSessionJwt,
} from "@/server/establishmentSessionJwt";

describe("establishmentSessionJwt", () => {
  it("signe un jeton et le renouvelle avant expiration", async () => {
    process.env.SESSION_SECRET = "test-secret-at-least-32-characters-long";
    const token = await signEstablishmentSessionJwt({
      kind: "establishment",
      role: "ADMIN",
      establishmentId: "est-1",
      accessCredentialRevision: 1,
    });
    expect(token.split(".")).toHaveLength(3);
    expect(
      establishmentJwtShouldRefresh(token, ESTABLISHMENT_JWT_REFRESH_WITHIN_SEC),
    ).toBe(false);
  });
});
