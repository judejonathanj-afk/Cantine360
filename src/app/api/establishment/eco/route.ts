import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { EcoObjectivePeriod } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { isMissingEcoPeriodColumns } from "@/server/establishmentEco";

const PatchSchema = z.object({
  ecoRestesServisTargetPct: z.number().min(0).max(100).nullable().optional(),
  ecoReductionTargetPct: z.number().min(0).max(100).nullable().optional(),
  ecoPeriodKind: z.nativeEnum(EcoObjectivePeriod).optional(),
  ecoSchoolYearStartMonth: z.number().int().min(1).max(12).optional(),
  ecoSchoolYearStartDay: z.number().int().min(1).max(31).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Seul l’administrateur de l’établissement peut modifier les objectifs." },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const b = parsed.data;
  const hasPeriodFields =
    b.ecoPeriodKind !== undefined ||
    b.ecoSchoolYearStartMonth !== undefined ||
    b.ecoSchoolYearStartDay !== undefined;

  const legacyData = {
    ...(b.ecoRestesServisTargetPct !== undefined && {
      ecoRestesServisTargetPct: b.ecoRestesServisTargetPct,
    }),
    ...(b.ecoReductionTargetPct !== undefined && {
      ecoReductionTargetPct: b.ecoReductionTargetPct,
    }),
  };

  const fullData = {
    ...legacyData,
    ...(b.ecoPeriodKind !== undefined && { ecoPeriodKind: b.ecoPeriodKind }),
    ...(b.ecoSchoolYearStartMonth !== undefined && {
      ecoSchoolYearStartMonth: b.ecoSchoolYearStartMonth,
    }),
    ...(b.ecoSchoolYearStartDay !== undefined && {
      ecoSchoolYearStartDay: b.ecoSchoolYearStartDay,
    }),
  };

  try {
    await db.establishment.update({
      where: { id: session.establishmentId },
      data: fullData,
    });
    revalidatePath("/dashboard");
    revalidatePath("/admin/groups");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (!isMissingEcoPeriodColumns(e)) {
      console.error("[api/establishment/eco] update", e);
      return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
    }
    if (Object.keys(legacyData).length === 0) {
      return NextResponse.json(
        {
          error:
            "Les colonnes de période objectifs ne sont pas encore sur cette base. Exécutez les migrations Prisma, ou enregistrez d’abord les objectifs en pourcentage.",
        },
        { status: 409 },
      );
    }
    try {
      await db.establishment.update({
        where: { id: session.establishmentId },
        data: legacyData,
      });
      revalidatePath("/dashboard");
      revalidatePath("/admin/groups");
      return NextResponse.json({
        ok: true,
        ...(hasPeriodFields && {
          warning:
            "Les colonnes de période objectifs ne sont pas encore sur cette base : exécutez les migrations Prisma, puis réessayez pour enregistrer la période.",
        }),
      });
    } catch (e2) {
      console.error("[api/establishment/eco] legacy update", e2);
      if (isMissingEcoPeriodColumns(e2)) {
        return NextResponse.json(
          {
            error:
              "Cette base n’a pas encore les colonnes « objectifs ». Dans le dossier du projet, exécutez : npx prisma migrate deploy (ou npm run prisma:migrate en développement), puis redémarrez le serveur.",
          },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
    }
  }
}
