import Papa from "papaparse";
import type { PrismaClient } from "@/generated/prisma/client";

export type ImportGroupRow = {
  school: string;
  className: string;
};

const SCHOOL_HEADERS = new Set(["ecole", "école", "school", "etablissement", "établissement"]);
const CLASS_HEADERS = new Set(["classe", "class", "groupe", "group"]);

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function pickColumn(
  headers: string[],
  aliases: Set<string>,
): number | null {
  const idx = headers.findIndex((h) => aliases.has(normalizeHeader(h)));
  return idx >= 0 ? idx : null;
}

/** Parse un CSV écoles/classes (séparateur ; ou ,). */
export function parseGroupsImportCsv(text: string): {
  rows: ImportGroupRow[];
  errors: string[];
} {
  const parsed = Papa.parse<string[]>(text.trim(), {
    delimiter: "",
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return {
      rows: [],
      errors: parsed.errors.map((e) => e.message ?? "Erreur de parsing CSV"),
    };
  }

  const data = parsed.data.filter((row) => row.some((c) => String(c ?? "").trim()));
  if (data.length === 0) {
    return { rows: [], errors: ["Fichier vide."] };
  }

  const first = data[0].map((c) => String(c ?? "").trim());
  const schoolIdx = pickColumn(first, SCHOOL_HEADERS);
  const classIdx = pickColumn(first, CLASS_HEADERS);
  const hasHeader = schoolIdx !== null && classIdx !== null;

  const body = hasHeader ? data.slice(1) : data;
  const sIdx = hasHeader ? schoolIdx! : 0;
  const cIdx = hasHeader ? classIdx! : 1;

  const rows: ImportGroupRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < body.length; i++) {
    const lineNo = hasHeader ? i + 2 : i + 1;
    const row = body[i];
    const school = String(row[sIdx] ?? "").trim();
    const className = String(row[cIdx] ?? "").trim();

    if (!school && !className) continue;
    if (!school || !className) {
      errors.push(`Ligne ${lineNo} : école et classe requises.`);
      continue;
    }
    rows.push({ school, className });
  }

  return { rows, errors };
}

export type ImportGroupsResult = {
  schoolsCreated: number;
  groupsCreated: number;
  groupsSkipped: number;
  errors: string[];
};

export async function importGroupsForEstablishment(
  db: PrismaClient,
  establishmentId: string,
  rows: ImportGroupRow[],
): Promise<ImportGroupsResult> {
  let schoolsCreated = 0;
  let groupsCreated = 0;
  let groupsSkipped = 0;
  const errors: string[] = [];

  const seen = new Set<string>();

  for (const row of rows) {
    const key = `${row.school.toLowerCase()}::${row.className.toLowerCase()}`;
    if (seen.has(key)) {
      groupsSkipped++;
      continue;
    }
    seen.add(key);

    let school = await db.school.findFirst({
      where: { establishmentId, name: row.school },
      select: { id: true },
    });

    if (!school) {
      school = await db.school.create({
        data: {
          name: row.school,
          establishmentId,
        },
        select: { id: true },
      });
      schoolsCreated++;
    }

    const existing = await db.group.findFirst({
      where: { schoolId: school.id, name: row.className },
      select: { id: true },
    });

    if (existing) {
      groupsSkipped++;
      continue;
    }

    try {
      await db.group.create({
        data: {
          name: row.className,
          schoolId: school.id,
          establishmentId,
        },
      });
      groupsCreated++;
    } catch {
      groupsSkipped++;
      errors.push(`Impossible d’ajouter « ${row.school} — ${row.className} ».`);
    }
  }

  return { schoolsCreated, groupsCreated, groupsSkipped, errors };
}
