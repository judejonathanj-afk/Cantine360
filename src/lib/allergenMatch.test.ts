import { describe, expect, it } from "vitest";
import {
  allergensIntersect,
  countStudentsAffectedByDish,
  parseAllergenTokens,
  studentAffectedByMenu,
} from "@/lib/allergenMatch";

describe("parseAllergenTokens", () => {
  it("mappe les alias CSV vers les libellés EU-14", () => {
    expect(parseAllergenTokens("Gluten, Lait")).toEqual([
      "Céréales contenant du gluten",
      "Lait",
    ]);
  });

  it("accepte les séparateurs virgule et point-virgule", () => {
    const tokens = parseAllergenTokens("Œufs;Soja");
    expect(tokens).toContain("Œufs");
    expect(tokens).toContain("Soja");
  });

  it("retourne un tableau vide pour une chaîne vide", () => {
    expect(parseAllergenTokens("")).toEqual([]);
  });
});

describe("allergen cross-ref", () => {
  it("détecte l’intersection entre élève et plat", () => {
    expect(allergensIntersect(["Lait", "Œufs"], ["Lait", "Gluten"])).toEqual(["Lait"]);
  });

  it("compte les élèves concernés par un plat", () => {
    const students = [
      { allergens: ["Lait"] },
      { allergens: ["Céréales contenant du gluten"] },
      { allergens: [] },
      { allergens: ["Lait", "Œufs"] },
    ];
    expect(
      countStudentsAffectedByDish(students, [
        "Lait",
        "Céréales contenant du gluten",
      ]),
    ).toBe(3);
  });

  it("signale un élève touché par au moins un plat du menu", () => {
    const affected = studentAffectedByMenu(
      ["Céréales contenant du gluten"],
      [["Lait"], ["Céréales contenant du gluten"]],
    );
    expect(affected).toBe(true);
  });
});
