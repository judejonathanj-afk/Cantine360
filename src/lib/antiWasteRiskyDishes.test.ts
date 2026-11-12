import { describe, expect, it } from "vitest";
import {
  applyRiskyDishLevel,
  type RiskyDishRow,
} from "./antiWasteRiskyDishes";

const dishes: RiskyDishRow[] = [
  {
    label: "salade",
    avgWasteGPer100: 200,
    serviceCount: 2,
    vsTarget: "above",
    maternelleGPer100: 80,
    primaireGPer100: 210,
  },
  {
    label: "riz",
    avgWasteGPer100: 40,
    serviceCount: 1,
    vsTarget: "ok",
    maternelleGPer100: null,
    primaireGPer100: 40,
  },
];

describe("applyRiskyDishLevel", () => {
  it("keeps all dishes when level is all", () => {
    expect(applyRiskyDishLevel(dishes, "all")).toEqual(dishes);
  });

  it("keeps only dishes with a positive average for the selected level", () => {
    const maternelle = applyRiskyDishLevel(dishes, "MATERNELLE");
    expect(maternelle).toHaveLength(1);
    expect(maternelle[0]?.label).toBe("salade");
    expect(maternelle[0]?.avgWasteGPer100).toBe(80);
  });
});
