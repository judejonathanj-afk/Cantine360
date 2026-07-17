import { describe, expect, it } from "vitest";
import { computeCantinePulse, type CantineServiceRow } from "@/lib/cantinePulse";

const NOW = new Date("2026-06-18T12:00:00");

function row(
  date: string,
  overrides: Partial<CantineServiceRow> = {},
): CantineServiceRow {
  return {
    date,
    mealType: "LUNCH",
    group: "École — CE1 A",
    presentCount: 0,
    servedCount: 0,
    rabCount: 0,
    refusedCount: 0,
    leftoversCount: 0,
    ...overrides,
  };
}

describe("computeCantinePulse", () => {
  it("retourne score null sans aucune saisie", () => {
    const pulse = computeCantinePulse([], "LUNCH", { now: NOW });
    expect(pulse.score).toBeNull();
    expect(pulse.mood).toBe("pending");
  });

  it("affiche un score dès la première semaine avec des servis", () => {
    const pulse = computeCantinePulse(
      [row("2026-06-18", { servedCount: 25, rabCount: 2 })],
      "LUNCH",
      { now: NOW },
    );
    expect(pulse.score).not.toBeNull();
    expect(pulse.score!).toBeGreaterThan(0);
    expect(pulse.mood).not.toBe("pending");
    expect(pulse.meta.weeksWithServed.current).toBe(true);
    expect(pulse.meta.weeksWithServed.previous).toBe(false);
    expect(pulse.headline).toContain("déchets");
  });

  it("attribue un score élevé avec peu de déchets sur deux semaines", () => {
    const rows = [
      row("2026-06-10", { servedCount: 20 }),
      row("2026-06-18", { servedCount: 25 }),
    ];
    const pulse = computeCantinePulse(rows, "LUNCH", {
      now: NOW,
      wasteRows: [
        { date: "2026-06-10", mealType: "LUNCH", wasteWeightG: 200 },
        { date: "2026-06-18", mealType: "LUNCH", wasteWeightG: 250 },
      ],
    });
    expect(pulse.score).not.toBeNull();
    expect(pulse.score!).toBeGreaterThanOrEqual(75);
    expect(pulse.mood).toBe("great");
  });

  it("baisse le score quand le poids des déchets augmente", () => {
    const lowWaste = computeCantinePulse(
      [
        row("2026-06-10", { servedCount: 100 }),
        row("2026-06-18", { servedCount: 100 }),
      ],
      "LUNCH",
      {
        now: NOW,
        wasteRows: [
          { date: "2026-06-10", mealType: "LUNCH", wasteWeightG: 500 },
          { date: "2026-06-18", mealType: "LUNCH", wasteWeightG: 500 },
        ],
      },
    );
    const highWaste = computeCantinePulse(
      [
        row("2026-06-10", { servedCount: 100 }),
        row("2026-06-18", { servedCount: 100 }),
      ],
      "LUNCH",
      {
        now: NOW,
        wasteRows: [
          { date: "2026-06-10", mealType: "LUNCH", wasteWeightG: 500 },
          { date: "2026-06-18", mealType: "LUNCH", wasteWeightG: 8000 },
        ],
      },
    );
    expect(lowWaste.score!).toBeGreaterThan(highWaste.score!);
  });

  it("pénalise légèrement un taux RAB élevé", () => {
    const noRab = [
      row("2026-06-10", { servedCount: 100, rabCount: 0 }),
      row("2026-06-18", { servedCount: 100, rabCount: 0 }),
    ];
    const withRab = [
      row("2026-06-10", { servedCount: 100, rabCount: 0 }),
      row("2026-06-18", { servedCount: 100, rabCount: 8 }),
    ];
    const a = computeCantinePulse(noRab, "LUNCH", { now: NOW });
    const b = computeCantinePulse(withRab, "LUNCH", { now: NOW });
    expect(a.score!).toBeGreaterThan(b.score!);
  });

  it("pénalise un grammage déchets élevé", () => {
    const lowWaste = computeCantinePulse(
      [row("2026-06-18", { servedCount: 100 })],
      "LUNCH",
      {
        now: NOW,
        wasteRows: [{ date: "2026-06-18", mealType: "LUNCH", wasteWeightG: 200 }],
      },
    );
    const highWaste = computeCantinePulse(
      [row("2026-06-18", { servedCount: 100 })],
      "LUNCH",
      {
        now: NOW,
        wasteRows: [{ date: "2026-06-18", mealType: "LUNCH", wasteWeightG: 5000 }],
      },
    );
    expect(lowWaste.score!).toBeGreaterThan(highWaste.score!);
    expect(highWaste.meta.curr.wasteWeightG).toBe(5000);
  });

  it("ignore les lignes d’un autre type de repas", () => {
    const pulse = computeCantinePulse(
      [row("2026-06-18", { mealType: "DINNER", servedCount: 50 })],
      "LUNCH",
      { now: NOW },
    );
    expect(pulse.score).toBeNull();
    expect(pulse.meta.curr.served).toBe(0);
  });
});
