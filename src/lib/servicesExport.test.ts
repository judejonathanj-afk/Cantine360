import { describe, expect, it } from "vitest";
import { MealType } from "@/generated/prisma/client";
import {
  buildServiceMetricExportRows,
  buildServiceWasteSummaryRows,
} from "@/lib/servicesExport";

const lunch = new Date("2026-06-10T12:00:00");

describe("buildServiceMetricExportRows", () => {
  it("répète le grammage déchets sur chaque ligne classe du même service", () => {
    const rows = buildServiceMetricExportRows([
      {
        date: lunch,
        mealType: MealType.LUNCH,
        wasteWeightG: 8500,
        wasteWeightMaternelleG: 3000,
        wasteWeightPrimaireG: 5500,
        metrics: [
          {
            presentCount: 22,
            servedCount: 22,
            rabCount: 0,
            refusedCount: 0,
            group: { name: "CE1 A", school: { name: "École Anne Frank" } },
          },
          {
            presentCount: 23,
            servedCount: 23,
            rabCount: 1,
            refusedCount: 0,
            group: { name: "CE1 B", school: { name: "École Anne Frank" } },
          },
        ],
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row["Déchets total (g)"] === 8500)).toBe(true);
    expect(rows.every((row) => row["Déchets maternelle (g)"] === 3000)).toBe(true);
    expect(rows.every((row) => row["Déchets primaire (g)"] === 5500)).toBe(true);
    expect(rows[0]?.["Libellé classe"]).toBe("École Anne Frank — CE1 A");
    expect(rows[0]?.Repas).toBe("Déjeuner");
    expect(rows[0]).not.toHaveProperty("leftoversCount");
  });

  it("inclut un service sans classe quand seul le grammage déchets est renseigné", () => {
    const rows = buildServiceMetricExportRows([
      {
        date: lunch,
        mealType: MealType.LUNCH,
        wasteWeightG: 4200,
        metrics: [],
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      Date: "2026-06-10",
      Repas: "Déjeuner",
      École: "",
      Classe: "",
      "Déchets total (g)": 4200,
      "Déchets maternelle (g)": "",
      "Déchets primaire (g)": "",
    });
  });
});

describe("buildServiceWasteSummaryRows", () => {
  it("liste un service par ligne avec déchets renseignés", () => {
    const rows = buildServiceWasteSummaryRows([
      {
        date: lunch,
        mealType: MealType.LUNCH,
        wasteWeightG: 8500,
        wasteWeightMaternelleG: 2500,
        wasteWeightPrimaireG: 6000,
        metrics: [],
      },
      {
        date: new Date("2026-06-11T12:00:00"),
        mealType: MealType.LUNCH,
        wasteWeightG: null,
        metrics: [],
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      Date: "2026-06-10",
      Repas: "Déjeuner",
      "Déchets total (g)": 8500,
      "Déchets total (kg)": 8.5,
      "Déchets maternelle (g)": 2500,
      "Déchets primaire (g)": 6000,
    });
  });
});
