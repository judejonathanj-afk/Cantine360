import { describe, expect, it } from "vitest";
import { formatServiceDateKey } from "@/lib/serviceDate";

describe("formatServiceDateKey", () => {
  it("formate minuit Paris en jour calendaire local", () => {
    // 2026-06-17T22:00:00Z = 2026-06-18 00:00 à Paris (CEST)
    const date = new Date("2026-06-17T22:00:00.000Z");
    expect(formatServiceDateKey(date)).toBe("2026-06-18");
  });

  it("évite le décalage UTC d’un toISOString", () => {
    const date = new Date("2026-06-17T22:00:00.000Z");
    expect(date.toISOString().slice(0, 10)).toBe("2026-06-17");
    expect(formatServiceDateKey(date)).toBe("2026-06-18");
  });
});
