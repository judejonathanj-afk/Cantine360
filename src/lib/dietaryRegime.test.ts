import { describe, expect, it } from "vitest";
import {
  countDietForDish,
  dietConflictsWithMenu,
  parseOuiNon,
} from "@/lib/dietaryRegime";
import { parseStudentsImportCsv } from "@/server/importStudents";

describe("dietaryRegime", () => {
  it("parseOuiNon", () => {
    expect(parseOuiNon("oui")).toBe(true);
    expect(parseOuiNon("OUI")).toBe(true);
    expect(parseOuiNon("1")).toBe(true);
    expect(parseOuiNon("non")).toBe(false);
    expect(parseOuiNon("")).toBe(false);
    expect(parseOuiNon("x")).toBe(true);
  });

  it("sans porc vs plat au porc", () => {
    const { noPorkDishes, vegetarianDishes } = dietConflictsWithMenu(
      { noPork: true, vegetarian: false },
      [
        { label: "Saucisse", containsPork: true, containsMeat: true },
        { label: "Yaourt", containsPork: false, containsMeat: false },
      ],
    );
    expect(noPorkDishes).toEqual(["Saucisse"]);
    expect(vegetarianDishes).toEqual([]);
  });

  it("végétarien vs viande sans porc", () => {
    const { vegetarianDishes } = dietConflictsWithMenu(
      { noPork: false, vegetarian: true },
      [{ label: "Poulet", containsPork: false, containsMeat: true }],
    );
    expect(vegetarianDishes).toEqual(["Poulet"]);
  });

  it("countDietForDish", () => {
    const students = [
      { noPork: true, vegetarian: false },
      { noPork: true, vegetarian: true },
      { noPork: false, vegetarian: true },
    ];
    expect(
      countDietForDish(students, { containsPork: true, containsMeat: true }),
    ).toEqual({ noPork: 2, vegetarian: 2 });
  });

  it("CSV sans_porc / vegetarien", () => {
    const { rows, errors } = parseStudentsImportCsv(
      "ecole;classe;prenom;nom;allergenes;sans_porc;vegetarien\nA;CP;Léa;Martin;;oui;\nA;CP;Tom;Dupont;;;oui\n",
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ noPork: true, vegetarian: false });
    expect(rows[1]).toMatchObject({ noPork: false, vegetarian: true });
  });
});
