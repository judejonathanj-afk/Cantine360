import { describe, expect, it } from "vitest";
import {
  hashEstablishmentPin,
  isHashedPin,
  verifyEstablishmentPin,
} from "@/lib/pinHash";

describe("pinHash", () => {
  it("hash puis vérifie un PIN", async () => {
    const hash = await hashEstablishmentPin("1234");
    expect(isHashedPin(hash)).toBe(true);
    expect(await verifyEstablishmentPin("1234", hash)).toBe(true);
    expect(await verifyEstablishmentPin("9999", hash)).toBe(false);
  });

  it("accepte encore un PIN en clair (legacy)", async () => {
    expect(await verifyEstablishmentPin("5678", "5678")).toBe(true);
    expect(await verifyEstablishmentPin("5678", "0000")).toBe(false);
  });

  it("normalise les chiffres avant hash/vérif", async () => {
    const hash = await hashEstablishmentPin("12 34");
    expect(await verifyEstablishmentPin("1-2-3-4", hash)).toBe(true);
  });
});
