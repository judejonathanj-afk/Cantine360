import type { MealType } from "@/generated/prisma/client";
import type { CantineServiceRow, CantineWasteDayRow } from "@/lib/cantinePulse";
import { formatGroupLabel } from "@/lib/groupLabel";
import { formatServiceDateKey } from "@/lib/serviceDate";

export type ServiceWithGroupMetrics = {
  date: Date;
  mealType: MealType;
  wasteWeightG?: number | null;
  metrics: Array<{
    presentCount: number;
    servedCount: number;
    rabCount: number;
    refusedCount: number;
    leftoversCount: number;
    group?: {
      id?: string;
      name: string;
      school: { name: string };
      level?: "MATERNELLE" | "PRIMAIRE";
    };
  }>;
};

/** Aplatit les services Prisma (métriques par groupe) au format attendu par `computeCantinePulse`. */
export function servicesToCantinePulseRows(
  services: ServiceWithGroupMetrics[],
): CantineServiceRow[] {
  const rows: CantineServiceRow[] = [];
  for (const s of services) {
    const date = formatServiceDateKey(s.date);
    for (const m of s.metrics) {
      rows.push({
        date,
        mealType: s.mealType,
        group: m.group
          ? formatGroupLabel(m.group.school.name, m.group.name)
          : "—",
        presentCount: m.presentCount,
        servedCount: m.servedCount,
        rabCount: m.rabCount,
        refusedCount: m.refusedCount,
        leftoversCount: m.leftoversCount,
      });
    }
  }
  return rows;
}

/** Une ligne par service avec grammage déchets renseigné. */
export function servicesToCantinePulseWasteRows(
  services: ServiceWithGroupMetrics[],
): CantineWasteDayRow[] {
  return services
    .filter((s) => s.wasteWeightG != null && s.wasteWeightG > 0)
    .map((s) => ({
      date: formatServiceDateKey(s.date),
      mealType: String(s.mealType),
      wasteWeightG: s.wasteWeightG!,
    }));
}

