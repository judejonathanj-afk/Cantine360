import Papa from "papaparse";
import type { MealType, PrismaClient } from "@/generated/prisma/client";

export type ImportAttendanceRow = {
  school: string;
  className: string;
  presentCount: number;
};

const SCHOOL_HEADERS = new Set(["ecole", "école", "school", "etablissement", "établissement"]);
const CLASS_HEADERS = new Set(["classe", "class", "groupe", "group"]);
const PRESENT_HEADERS = new Set([
  "presents",
  "présents",
  "present",
  "presentcount",
  "effectif",
  "nb",
  "nombre",
]);

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

function pickColumn(headers: string[], aliases: Set<string>): number | null {
  const idx = headers.findIndex((h) => aliases.has(normalizeHeader(h)));
  return idx >= 0 ? idx : null;
}

export function parseAttendanceImportCsv(text: string): {
  rows: ImportAttendanceRow[];
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
  const presentIdx = pickColumn(first, PRESENT_HEADERS);
  const hasHeader = schoolIdx !== null && classIdx !== null && presentIdx !== null;

  const body = hasHeader ? data.slice(1) : data;
  const sIdx = hasHeader ? schoolIdx! : 0;
  const cIdx = hasHeader ? classIdx! : 1;
  const pIdx = hasHeader ? presentIdx! : 2;

  const rows: ImportAttendanceRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < body.length; i++) {
    const lineNo = hasHeader ? i + 2 : i + 1;
    const row = body[i];
    const school = String(row[sIdx] ?? "").trim();
    const className = String(row[cIdx] ?? "").trim();
    const presentRaw = String(row[pIdx] ?? "").trim().replace(/[^\d]/g, "");

    if (!school && !className && !presentRaw) continue;
    if (!school || !className) {
      errors.push(`Ligne ${lineNo} : école et classe requises.`);
      continue;
    }
    if (!presentRaw) {
      errors.push(`Ligne ${lineNo} : nombre de présents requis.`);
      continue;
    }

    const presentCount = Number(presentRaw);
    if (!Number.isFinite(presentCount) || presentCount < 0 || presentCount > 500) {
      errors.push(`Ligne ${lineNo} : présents invalides (0–500).`);
      continue;
    }

    rows.push({ school, className, presentCount });
  }

  return { rows, errors };
}

export type ImportAttendanceResult = {
  groupsUpdated: number;
  groupsSkipped: number;
  errors: string[];
};

export async function importAttendanceForService(
  db: PrismaClient,
  establishmentId: string,
  serviceId: string,
  mealType: MealType,
  serviceDate: Date,
  rawFileName: string,
  rows: ImportAttendanceRow[],
): Promise<ImportAttendanceResult> {
  let groupsUpdated = 0;
  let groupsSkipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const school = await db.school.findFirst({
      where: { establishmentId, name: row.school },
      select: { id: true },
    });
    if (!school) {
      groupsSkipped++;
      errors.push(`École introuvable « ${row.school} » (${row.className}).`);
      continue;
    }

    const group = await db.group.findFirst({
      where: { schoolId: school.id, name: row.className, active: true },
      select: { id: true },
    });
    if (!group) {
      groupsSkipped++;
      errors.push(`Classe introuvable « ${row.className} » (${row.school}).`);
      continue;
    }

    await db.serviceGroupMetrics.upsert({
      where: {
        serviceId_groupId: { serviceId, groupId: group.id },
      },
      create: {
        serviceId,
        groupId: group.id,
        presentCount: row.presentCount,
      },
      update: {
        presentCount: row.presentCount,
      },
    });
    groupsUpdated++;
  }

  if (groupsUpdated > 0) {
    await db.attendanceImport.create({
      data: {
        establishmentId,
        serviceDate,
        mealType,
        rawFileName,
        processedAt: new Date(),
      },
    });
  }

  return { groupsUpdated, groupsSkipped, errors };
}
