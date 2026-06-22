import Papa from "papaparse";
import type { PrismaClient } from "@/generated/prisma/client";
import { parseAllergenTokens } from "@/lib/allergenMatch";

export type ImportStudentRow = {
  school: string;
  className: string;
  firstName: string;
  lastName: string;
  allergensRaw: string;
};

const SCHOOL_HEADERS = new Set(["ecole", "école", "school", "etablissement", "établissement"]);
const CLASS_HEADERS = new Set(["classe", "class", "groupe", "group"]);
const FIRST_HEADERS = new Set(["prenom", "prénom", "firstname", "first_name"]);
const LAST_HEADERS = new Set(["nom", "lastname", "last_name", "name"]);
const ALLERGEN_HEADERS = new Set(["allergenes", "allergènes", "allergens", "allergie", "allergies"]);

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function pickColumn(headers: string[], aliases: Set<string>): number | null {
  const idx = headers.findIndex((h) => aliases.has(normalizeHeader(h)));
  return idx >= 0 ? idx : null;
}

export function parseStudentsImportCsv(text: string): {
  rows: ImportStudentRow[];
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
  if (data.length === 0) return { rows: [], errors: ["Fichier vide."] };

  const first = data[0].map((c) => String(c ?? "").trim());
  const schoolIdx = pickColumn(first, SCHOOL_HEADERS);
  const classIdx = pickColumn(first, CLASS_HEADERS);
  const firstIdx = pickColumn(first, FIRST_HEADERS);
  const lastIdx = pickColumn(first, LAST_HEADERS);
  const allergenIdx = pickColumn(first, ALLERGEN_HEADERS);
  const hasHeader =
    schoolIdx !== null &&
    classIdx !== null &&
    firstIdx !== null &&
    lastIdx !== null;

  const body = hasHeader ? data.slice(1) : data;
  const sIdx = hasHeader ? schoolIdx! : 0;
  const cIdx = hasHeader ? classIdx! : 1;
  const fIdx = hasHeader ? firstIdx! : 2;
  const lIdx = hasHeader ? lastIdx! : 3;
  const aIdx = hasHeader ? (allergenIdx ?? 4) : 4;

  const rows: ImportStudentRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < body.length; i++) {
    const lineNo = hasHeader ? i + 2 : i + 1;
    const row = body[i];
    const school = String(row[sIdx] ?? "").trim();
    const className = String(row[cIdx] ?? "").trim();
    const firstName = String(row[fIdx] ?? "").trim();
    const lastName = String(row[lIdx] ?? "").trim();
    const allergensRaw = String(row[aIdx] ?? "").trim();

    if (!school && !className && !firstName && !lastName) continue;
    if (!school || !className || !firstName || !lastName) {
      errors.push(`Ligne ${lineNo} : école, classe, prénom et nom requis.`);
      continue;
    }
    rows.push({ school, className, firstName, lastName, allergensRaw });
  }

  return { rows, errors };
}

export type ImportStudentsResult = {
  studentsCreated: number;
  studentsUpdated: number;
  studentsSkipped: number;
  errors: string[];
};

export async function importStudentsForEstablishment(
  db: PrismaClient,
  establishmentId: string,
  rows: ImportStudentRow[],
): Promise<ImportStudentsResult> {
  let studentsCreated = 0;
  let studentsUpdated = 0;
  let studentsSkipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const school = await db.school.findFirst({
      where: { establishmentId, name: row.school },
      select: { id: true },
    });
    if (!school) {
      studentsSkipped++;
      errors.push(
        `École introuvable « ${row.school} » pour ${row.firstName} ${row.lastName}. Importez d’abord les classes.`,
      );
      continue;
    }

    const group = await db.group.findFirst({
      where: { schoolId: school.id, name: row.className },
      select: { id: true },
    });
    if (!group) {
      studentsSkipped++;
      errors.push(
        `Classe introuvable « ${row.className} » (${row.school}) pour ${row.firstName} ${row.lastName}.`,
      );
      continue;
    }

    const allergens = parseAllergenTokens(row.allergensRaw);

    const existing = await db.student.findUnique({
      where: {
        groupId_firstName_lastName: {
          groupId: group.id,
          firstName: row.firstName,
          lastName: row.lastName,
        },
      },
      select: { id: true },
    });

    try {
      if (existing) {
        await db.student.update({
          where: { id: existing.id },
          data: { allergens, active: true },
        });
        studentsUpdated++;
      } else {
        await db.student.create({
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
            allergens,
            groupId: group.id,
            establishmentId,
          },
        });
        studentsCreated++;
      }
    } catch {
      studentsSkipped++;
      errors.push(`Impossible d’enregistrer ${row.firstName} ${row.lastName}.`);
    }
  }

  return { studentsCreated, studentsUpdated, studentsSkipped, errors };
}
