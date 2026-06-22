import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import {
  importAttendanceForService,
  parseAttendanceImportCsv,
} from "@/server/importAttendance";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { serviceId } = await params;
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId: session.establishmentId },
  });
  if (!service) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const { rows, errors: parseErrors } = parseAttendanceImportCsv(text);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Aucune ligne valide à importer.", parseErrors },
      { status: 400 },
    );
  }

  const result = await importAttendanceForService(
    db,
    session.establishmentId,
    serviceId,
    service.mealType,
    service.date,
    file.name,
    rows,
  );

  return NextResponse.json({
    ...result,
    parseErrors,
    importedRows: rows.length,
  });
}
