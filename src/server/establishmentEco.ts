import {
  Prisma,
  type EcoObjectivePeriod,
  type PrismaClient,
} from "@/generated/prisma/client";

export type EstablishmentEcoSettings = {
  ecoRestesServisTargetPct: number | null;
  ecoReductionTargetPct: number | null;
  ecoPeriodKind: EcoObjectivePeriod;
  ecoSchoolYearStartMonth: number;
  ecoSchoolYearStartDay: number;
};

const ECO_MIN_SELECT = {
  ecoRestesServisTargetPct: true,
  ecoReductionTargetPct: true,
} as const;

const ECO_FULL_SELECT = {
  ...ECO_MIN_SELECT,
  ecoPeriodKind: true,
  ecoSchoolYearStartMonth: true,
  ecoSchoolYearStartDay: true,
} as const;

/** Colonne absente (migration pas appliquée). Prisma P2022 — éviter `instanceof` seul (bundles Turbopack). */
export function isMissingEcoPeriodColumns(e: unknown): boolean {
  if (typeof e === "object" && e !== null && "code" in e) {
    if (String((e as { code: unknown }).code) === "P2022") return true;
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
    return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return /P2022|does not exist in the current database|column.*does not exist|colonne.*n'existe pas/i.test(
    msg,
  );
}

const DEFAULT_PERIOD: Omit<
  EstablishmentEcoSettings,
  "ecoRestesServisTargetPct" | "ecoReductionTargetPct"
> = {
  ecoPeriodKind: "CALENDAR_YEAR",
  ecoSchoolYearStartMonth: 9,
  ecoSchoolYearStartDay: 1,
};

/**
 * Lit les réglages objectifs + période. Si la migration `eco_period` n’est pas encore
 * appliquée sur la base, retombe sur les deux premiers champs et des défauts pour la période.
 */
export async function getEstablishmentEcoSettings(
  db: PrismaClient,
  establishmentId: string,
): Promise<EstablishmentEcoSettings | null> {
  try {
    const r = await db.establishment.findUnique({
      where: { id: establishmentId },
      select: ECO_FULL_SELECT,
    });
    if (!r) return null;
    return {
      ecoRestesServisTargetPct: r.ecoRestesServisTargetPct,
      ecoReductionTargetPct: r.ecoReductionTargetPct,
      ecoPeriodKind: r.ecoPeriodKind,
      ecoSchoolYearStartMonth: r.ecoSchoolYearStartMonth,
      ecoSchoolYearStartDay: r.ecoSchoolYearStartDay,
    };
  } catch (e) {
    if (!isMissingEcoPeriodColumns(e)) throw e;
    const r = await db.establishment.findUnique({
      where: { id: establishmentId },
      select: ECO_MIN_SELECT,
    });
    if (!r) return null;
    return {
      ...DEFAULT_PERIOD,
      ecoRestesServisTargetPct: r.ecoRestesServisTargetPct,
      ecoReductionTargetPct: r.ecoReductionTargetPct,
    };
  }
}
