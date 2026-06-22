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
      [row("2026-06-18", { servedCount: 25, leftoversCount: 3, rabCount: 2 })],
      "LUNCH",
      { now: NOW },
    );
    expect(pulse.score).not.toBeNull();
    expect(pulse.score!).toBeGreaterThan(0);
    expect(pulse.mood).not.toBe("pending");
    expect(pulse.meta.weeksWithServed.current).toBe(true);
    expect(pulse.meta.weeksWithServed.previous).toBe(false);
    expect(pulse.subline).not.toContain("semaine précédente");
  });

  it("attribue un score élevé avec 0 reste sur deux semaines", () => {
    const rows = [
      row("2026-06-10", { servedCount: 20, leftoversCount: 0 }),
      row("2026-06-18", { servedCount: 25, leftoversCount: 0 }),
    ];
    const pulse = computeCantinePulse(rows, "LUNCH", { now: NOW });
    expect(pulse.score).not.toBeNull();
    expect(pulse.score!).toBeGreaterThanOrEqual(88);
    expect(pulse.mood).toBe("great");
    expect(pulse.headline).toContain("Aucun reste");
  });

  it("baisse le score quand le taux de restes augmente", () => {
    const lowWaste = [
      row("2026-06-10", { servedCount: 100, leftoversCount: 0 }),
      row("2026-06-18", { servedCount: 100, leftoversCount: 0 }),
    ];
    const highWaste = [
      row("2026-06-10", { servedCount: 100, leftoversCount: 0 }),
      row("2026-06-18", { servedCount: 100, leftoversCount: 10 }),
    ];
    const good = computeCantinePulse(lowWaste, "LUNCH", { now: NOW });
    const bad = computeCantinePulse(highWaste, "LUNCH", { now: NOW });
    expect(good.score!).toBeGreaterThan(bad.score!);
    expect(bad.mood).not.toBe("great");
  });

  it("pénalise légèrement un taux RAB élevé", () => {
    const noRab = [
      row("2026-06-10", { servedCount: 100, leftoversCount: 0, rabCount: 0 }),
      row("2026-06-18", { servedCount: 100, leftoversCount: 0, rabCount: 0 }),
    ];
    const withRab = [
      row("2026-06-10", { servedCount: 100, leftoversCount: 0, rabCount: 0 }),
      row("2026-06-18", { servedCount: 100, leftoversCount: 0, rabCount: 8 }),
    ];
    const a = computeCantinePulse(noRab, "LUNCH", { now: NOW });
    const b = computeCantinePulse(withRab, "LUNCH", { now: NOW });
    expect(a.score!).toBeGreaterThan(b.score!);
  });

  it("ignore les lignes d’un autre type de repas", () => {
    const pulse = computeCantinePulse(
      [
        row("2026-06-18", { mealType: "DINNER", servedCount: 50, leftoversCount: 0 }),
      ],
      "LUNCH",
      { now: NOW },
    );
    expect(pulse.score).toBeNull();
    expect(pulse.meta.curr.served).toBe(0);
  });
});
