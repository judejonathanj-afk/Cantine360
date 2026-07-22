import { describe, expect, it } from "vitest";
import {
  totalWasteFromLevels,
  wasteWeightForLevel,
} from "@/lib/serviceWasteByLevel";

describe("totalWasteFromLevels", () => {
  it("sums positive level weights", () => {
    expect(totalWasteFromLevels(1200, 3400)).toBe(4600);
  });

  it("returns null when both empty", () => {
    expect(totalWasteFromLevels(null, null)).toBeNull();
    expect(totalWasteFromLevels(0, 0)).toBeNull();
  });

  it("treats one missing level as zero", () => {
    expect(totalWasteFromLevels(1500, null)).toBe(1500);
    expect(totalWasteFromLevels(null, 800)).toBe(800);
  });
});

describe("wasteWeightForLevel", () => {
  it("uses level-specific weights when present", () => {
    const service = {
      wasteWeightG: 9999,
      wasteWeightMaternelleG: 1000,
      wasteWeightPrimaireG: 2000,
    };
    expect(wasteWeightForLevel(service, "MATERNELLE")).toBe(1000);
    expect(wasteWeightForLevel(service, "PRIMAIRE")).toBe(2000);
  });

  it("prorates legacy total by served share", () => {
    const service = { wasteWeightG: 1000 };
    const served = { MATERNELLE: 40, PRIMAIRE: 60 };
    expect(wasteWeightForLevel(service, "MATERNELLE", served)).toBe(400);
    expect(wasteWeightForLevel(service, "PRIMAIRE", served)).toBe(600);
  });

  it("returns 0 for a level with null when split exists", () => {
    const service = {
      wasteWeightG: 500,
      wasteWeightMaternelleG: 500,
      wasteWeightPrimaireG: null,
    };
    expect(wasteWeightForLevel(service, "PRIMAIRE")).toBe(0);
  });
});
