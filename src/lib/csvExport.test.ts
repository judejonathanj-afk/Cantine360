import { describe, expect, it } from "vitest";
import { unparseCsvSemicolon } from "@/lib/csvExport";

describe("unparseCsvSemicolon", () => {
  it("produit un CSV Excel FR (BOM, sep=;, point-virgule, guillemets)", () => {
    const csv = unparseCsvSemicolon([
      {
        Date: "2026-06-18",
        Plat: "lasagnes",
        Allergènes: "Lait, Céréales contenant du gluten",
        "Grammage (g)": 120,
      },
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("sep=;");
    expect(csv).toContain('"Lait, Céréales contenant du gluten"');
    expect(csv).toContain('"120"');
    expect(csv).toContain("\r\n");
    const lines = csv.replace(/^\uFEFF/, "").trim().split("\r\n");
    // sep=; puis en-tête puis données
    expect(lines[0]).toBe("sep=;");
    expect(lines[1].split(";").length).toBe(lines[2].split(";").length);
  });
});
