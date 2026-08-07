import { describe, expect, it } from "vitest";
import { antiWasteStatus } from "@/lib/antiWasteStatus";

describe("antiWasteStatus", () => {
  it("sans pesée", () => {
    const s = antiWasteStatus(null, 80);
    expect(s.tone).toBe("none");
    expect(s.title.toLowerCase()).toContain("pesée");
    expect(s.detail.length).toBeGreaterThan(20);
  });

  it("vert sous objectif", () => {
    const s = antiWasteStatus(70, 80);
    expect(s.tone).toBe("ok");
    expect(s.title.toLowerCase()).toContain("objectif");
  });

  it("explique le chiffre sans objectif", () => {
    const s = antiWasteStatus(1455.7, null);
    expect(s.tone).toBe("watch");
    expect(s.title).toMatch(/1455/);
    expect(s.detail.toLowerCase()).toContain("100 repas");
    expect(s.hint.toLowerCase()).toContain("objectif");
  });

  it("orange légèrement au-dessus", () => {
    expect(antiWasteStatus(90, 80).tone).toBe("watch");
  });

  it("rouge bien au-dessus", () => {
    expect(antiWasteStatus(120, 80).tone).toBe("alert");
  });
});
