import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { importStudentsForEstablishment, parseStudentsImportCsv } from "@/server/importStudents";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Corps multipart attendu" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier CSV requis (champ « file »)" }, { status: 400 });
  }

  const text = await file.text();
  const { rows, errors: parseErrors } = parseStudentsImportCsv(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Aucune ligne valide à importer.", parseErrors },
      { status: 400 },
    );
  }

  const result = await importStudentsForEstablishment(db, session.establishmentId, rows);

  return NextResponse.json({
    ...result,
    parseErrors,
    importedRows: rows.length,
  });
}
