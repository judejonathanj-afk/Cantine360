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
        metrics: [
          {
            presentCount: 22,
            servedCount: 22,
            rabCount: 0,
            refusedCount: 0,
            leftoversCount: 2,
            group: { name: "CE1 A", school: { name: "École Anne Frank" } },
          },
          {
            presentCount: 23,
            servedCount: 23,
            rabCount: 1,
            refusedCount: 0,
            leftoversCount: 0,
            group: { name: "CE1 B", school: { name: "École Anne Frank" } },
          },
        ],
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.wasteWeightG === 8500)).toBe(true);
    expect(rows[0]?.groupLabel).toBe("École Anne Frank — CE1 A");
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
      date: "2026-06-10",
      mealType: "LUNCH",
      school: "",
      group: "",
      wasteWeightG: 4200,
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
      date: "2026-06-10",
      wasteWeightG: 8500,
      wasteWeightKg: 8.5,
      repas: "Déjeuner",
    });
  });
});
