import type { MealType } from "@/generated/prisma/client";
import type { CantineServiceRow } from "@/lib/cantinePulse";
import { formatGroupLabel } from "@/lib/groupLabel";
import { formatServiceDateKey } from "@/lib/serviceDate";

export type ServiceWithGroupMetrics = {
  date: Date;
  mealType: MealType;
  metrics: Array<{
    presentCount: number;
    servedCount: number;
    rabCount: number;
    refusedCount: number;
    leftoversCount: number;
    group: { id: string; name: string; school: { name: string } };
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
        group: formatGroupLabel(m.group.school.name, m.group.name),
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

