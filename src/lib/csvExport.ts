import Papa from "papaparse";

/** Corps CSV point-virgule (sans BOM / hint). */
export function unparseCsvSemicolonBody(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  return Papa.unparse(rows, {
    delimiter: ";",
    quotes: true,
    quoteChar: '"',
    newline: "\r\n",
  });
}

/** CSV point-virgule, UTF-8 BOM + hint Excel FR, prêt à ouvrir en tableau. */
export function unparseCsvSemicolon(rows: Record<string, unknown>[]) {
  const body = unparseCsvSemicolonBody(rows);
  // BOM + sep=; : Excel (FR) ouvre directement en colonnes.
  return body ? `\uFEFFsep=;\r\n${body}` : "\uFEFFsep=;\r\n";
}

export function excelCsvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
