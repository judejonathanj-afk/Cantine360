import type { MealType } from "@/generated/prisma/client";
import type { CantineServiceRow } from "@/lib/cantinePulse";

export type ServiceWithGroupMetrics = {
  date: Date;
  mealType: MealType;
  metrics: Array<{
    presentCount: number;
    servedCount: number;
    refusedCount: number;
    leftoversCount: number;
    group: { id: string; name: string };
  }>;
};

/** Aplatit les services Prisma (métriques par groupe) au format attendu par `computeCantinePulse`. */
export function servicesToCantinePulseRows(
  services: ServiceWithGroupMetrics[],
): CantineServiceRow[] {
  const rows: CantineServiceRow[] = [];
  for (const s of services) {
    const date = s.date.toISOString().slice(0, 10);
    for (const m of s.metrics) {
      rows.push({
        date,
        mealType: s.mealType,
        group: m.group.name,
        presentCount: m.presentCount,
        servedCount: m.servedCount,
        refusedCount: m.refusedCount,
        leftoversCount: m.leftoversCount,
      });
    }
  }
  return rows;
}
