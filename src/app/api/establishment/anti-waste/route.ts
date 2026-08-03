import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import {
  isMissingAntiWasteColumns,
  updateEstablishmentAntiWasteSettings,
} from "@/server/establishmentAntiWaste";

const PatchSchema = z.object({
  antiWasteModeEnabled: z.boolean(),
  antiWasteTargetGPer100: z.number().min(0).max(5000).nullable().optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Seul l’administrateur de l’établissement peut activer le mode Antigaspillage.",
      },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  try {
    await updateEstablishmentAntiWasteSettings(db, session.establishmentId, {
      antiWasteModeEnabled: parsed.data.antiWasteModeEnabled,
      ...(parsed.data.antiWasteTargetGPer100 !== undefined && {
        antiWasteTargetGPer100: parsed.data.antiWasteTargetGPer100,
      }),
    });
    revalidatePath("/admin/groups");
    revalidatePath("/dashboard");
    revalidatePath("/antigaspillage");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/establishment/anti-waste]", e);
    if (isMissingAntiWasteColumns(e)) {
      return NextResponse.json(
        {
          error:
            "Les colonnes Antigaspillage ne sont pas encore sur cette base. Exécutez : npm run prisma:deploy",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }
}
