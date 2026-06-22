import { describe, expect, it } from "vitest";
import { parseAttendanceImportCsv } from "@/server/importAttendance";

const SAMPLE = `ecole;classe;presents
École Anne Frank;CE1 A;25
École Anne Frank;CE1 B;23
`;

describe("parseAttendanceImportCsv", () => {
  it("parse un CSV valide avec en-têtes", () => {
    const { rows, errors } = parseAttendanceImportCsv(SAMPLE);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { school: "École Anne Frank", className: "CE1 A", presentCount: 25 },
      { school: "École Anne Frank", className: "CE1 B", presentCount: 23 },
    ]);
  });

  it("rejette les présents hors plage", () => {
    const { rows, errors } = parseAttendanceImportCsv(
      "ecole;classe;presents\nÉcole Anne Frank;CE1 A;999",
    );
    expect(rows).toEqual([]);
    expect(errors.some((e) => e.includes("présents invalides"))).toBe(true);
  });

  it("exige école et classe", () => {
    const { rows, errors } = parseAttendanceImportCsv(
      "ecole;classe;presents\n;CE1 A;25",
    );
    expect(rows).toEqual([]);
    expect(errors.length).toBeGreaterThan(0);
  });
});
