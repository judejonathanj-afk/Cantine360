import type { PrismaClient } from "@/generated/prisma/client";

export type EstablishmentAntiWasteSettings = {
  antiWasteModeEnabled: boolean;
  antiWasteTargetGPer100: number | null;
  /** true si les colonnes DB manquent (migration non déployée). */
  schemaReady: boolean;
};

export function isMissingAntiWasteColumns(e: unknown): boolean {
  if (typeof e === "object" && e !== null && "code" in e) {
    if (String((e as { code: unknown }).code) === "P2022") return true;
  }
  const msg = e instanceof Error ? e.message : String(e);
  return /P2022|antiWasteModeEnabled|antiWasteTargetGPer100|does not exist|colonne/i.test(
    msg,
  );
}

function mapSettings(row: {
  antiWasteModeEnabled: boolean;
  antiWasteTargetGPer100: number | null;
}): EstablishmentAntiWasteSettings {
  return {
    antiWasteModeEnabled: Boolean(row.antiWasteModeEnabled),
    antiWasteTargetGPer100:
      row.antiWasteTargetGPer100 == null
        ? null
        : Number(row.antiWasteTargetGPer100),
    schemaReady: true,
  };
}

/**
 * Lit le mode Anti-gaspillage **de cet établissement uniquement**.
 * Persiste en base jusqu’à désactivation manuelle.
 */
export async function getEstablishmentAntiWasteSettings(
  db: PrismaClient,
  establishmentId: string,
): Promise<EstablishmentAntiWasteSettings> {
  try {
    const row = await db.establishment.findUnique({
      where: { id: establishmentId },
      select: {
        antiWasteModeEnabled: true,
        antiWasteTargetGPer100: true,
      },
    });
    if (!row) {
      return {
        antiWasteModeEnabled: false,
        antiWasteTargetGPer100: null,
        schemaReady: true,
      };
    }
    return mapSettings(row);
  } catch (e) {
    if (!isMissingAntiWasteColumns(e)) throw e;
    return {
      antiWasteModeEnabled: false,
      antiWasteTargetGPer100: null,
      schemaReady: false,
    };
  }
}

/**
 * Met à jour uniquement l’établissement `establishmentId` (pas les autres comptes).
 */
export async function updateEstablishmentAntiWasteSettings(
  db: PrismaClient,
  establishmentId: string,
  data: {
    antiWasteModeEnabled: boolean;
    antiWasteTargetGPer100?: number | null;
  },
): Promise<EstablishmentAntiWasteSettings | null> {
  try {
    const row = await db.establishment.update({
      where: { id: establishmentId },
      data: {
        antiWasteModeEnabled: data.antiWasteModeEnabled,
        ...(data.antiWasteTargetGPer100 !== undefined && {
          antiWasteTargetGPer100: data.antiWasteTargetGPer100,
        }),
      },
      select: {
        antiWasteModeEnabled: true,
        antiWasteTargetGPer100: true,
      },
    });
    return mapSettings(row);
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      String((e as { code: unknown }).code) === "P2025"
    ) {
      return null;
    }
    throw e;
  }
}
