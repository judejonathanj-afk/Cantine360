import { describe, expect, it } from "vitest";
import { unparseCsvSemicolon } from "@/lib/csvExport";

describe("unparseCsvSemicolon", () => {
  it("entoure les champs de guillemets", () => {
    const csv = unparseCsvSemicolon([
      {
        date: "2026-06-18",
        label: "lasagnes",
        allergens: "Lait, Céréales contenant du gluten",
        grammageG: 120,
      },
    ]);
    expect(csv).toContain('"Lait, Céréales contenant du gluten"');
    expect(csv).toContain('"120"');
    const lines = csv.trim().split("\n");
    expect(lines[0].split(";").length).toBe(lines[1].split(";").length);
  });
});
