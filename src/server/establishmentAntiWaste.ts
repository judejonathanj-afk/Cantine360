import type { PrismaClient } from "@/generated/prisma/client";

export type EstablishmentAntiWasteSettings = {
  antiWasteModeEnabled: boolean;
  antiWasteTargetGPer100: number | null;
};

type AntiWasteRow = {
  antiWasteModeEnabled: boolean;
  antiWasteTargetGPer100: number | null;
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

export async function getEstablishmentAntiWasteSettings(
  db: PrismaClient,
  establishmentId: string,
): Promise<EstablishmentAntiWasteSettings> {
  try {
    const rows = await db.$queryRaw<AntiWasteRow[]>`
      SELECT "antiWasteModeEnabled", "antiWasteTargetGPer100"
      FROM "Establishment"
      WHERE "id" = ${establishmentId}
      LIMIT 1
    `;
    const r = rows[0];
    if (!r) {
      return { antiWasteModeEnabled: false, antiWasteTargetGPer100: null };
    }
    return {
      antiWasteModeEnabled: Boolean(r.antiWasteModeEnabled),
      antiWasteTargetGPer100:
        r.antiWasteTargetGPer100 == null ? null : Number(r.antiWasteTargetGPer100),
    };
  } catch (e) {
    if (!isMissingAntiWasteColumns(e)) throw e;
    return { antiWasteModeEnabled: false, antiWasteTargetGPer100: null };
  }
}

export async function updateEstablishmentAntiWasteSettings(
  db: PrismaClient,
  establishmentId: string,
  data: {
    antiWasteModeEnabled: boolean;
    antiWasteTargetGPer100?: number | null;
  },
): Promise<void> {
  if (data.antiWasteTargetGPer100 !== undefined) {
    await db.$executeRaw`
      UPDATE "Establishment"
      SET
        "antiWasteModeEnabled" = ${data.antiWasteModeEnabled},
        "antiWasteTargetGPer100" = ${data.antiWasteTargetGPer100},
        "updatedAt" = NOW()
      WHERE "id" = ${establishmentId}
    `;
    return;
  }
  await db.$executeRaw`
    UPDATE "Establishment"
    SET
      "antiWasteModeEnabled" = ${data.antiWasteModeEnabled},
      "updatedAt" = NOW()
    WHERE "id" = ${establishmentId}
  `;
}
