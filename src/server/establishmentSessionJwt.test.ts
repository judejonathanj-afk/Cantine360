import { decodeJwt } from "jose";
import { describe, expect, it } from "vitest";
import {
  ESTABLISHMENT_JWT_REFRESH_WITHIN_SEC,
  establishmentJwtShouldRefresh,
  signEstablishmentSessionJwt,
} from "@/server/establishmentSessionJwt";

describe("establishmentSessionJwt", () => {
  it("signe un jeton cuisine et le renouvelle avant expiration", async () => {
    process.env.SESSION_SECRET = "test-secret-at-least-32-characters-long";
    const token = await signEstablishmentSessionJwt({
      kind: "establishment",
      role: "KITCHEN",
      establishmentId: "est-1",
      accessCredentialRevision: 1,
    });
    expect(token.split(".")).toHaveLength(3);
    expect(
      establishmentJwtShouldRefresh(token, ESTABLISHMENT_JWT_REFRESH_WITHIN_SEC),
    ).toBe(false);
  });

  it("signe un jeton admin 24 h sans renouvellement glissant", async () => {
    process.env.SESSION_SECRET = "test-secret-at-least-32-characters-long";
    const before = Math.floor(Date.now() / 1000);
    const token = await signEstablishmentSessionJwt({
      kind: "establishment",
      role: "ADMIN",
      establishmentId: "est-1",
      accessCredentialRevision: 1,
    });
    const payload = decodeJwt(token);
    expect(payload.exp).toBeGreaterThanOrEqual(before + 60 * 60 * 23);
    expect(payload.exp).toBeLessThanOrEqual(before + 60 * 60 * 25);
    expect(establishmentJwtShouldRefresh(token)).toBe(false);
  });
});
