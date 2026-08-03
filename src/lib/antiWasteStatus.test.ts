import { describe, expect, it } from "vitest";
import { antiWasteStatus } from "@/lib/antiWasteStatus";

describe("antiWasteStatus", () => {
  it("sans pesée", () => {
    expect(antiWasteStatus(null, 80).tone).toBe("none");
  });

  it("vert sous objectif", () => {
    expect(antiWasteStatus(70, 80).tone).toBe("ok");
  });

  it("orange légèrement au-dessus", () => {
    expect(antiWasteStatus(90, 80).tone).toBe("watch");
  });

  it("rouge bien au-dessus", () => {
    expect(antiWasteStatus(120, 80).tone).toBe("alert");
  });
});
