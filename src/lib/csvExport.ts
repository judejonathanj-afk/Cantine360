import Papa from "papaparse";

/** CSV point-virgule avec guillemets (Excel FR, champs contenant des ;). */
export function unparseCsvSemicolon(rows: Record<string, unknown>[]) {
  return Papa.unparse(rows, { delimiter: ";", quotes: true, quoteChar: '"' });
}
