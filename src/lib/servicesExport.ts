import type { MealType } from "@/generated/prisma/client";
import { formatGroupLabel } from "@/lib/groupLabel";
import { mealTypeLabelFr } from "@/lib/mealType";
import { formatServiceDateKey } from "@/lib/serviceDate";

export type ServiceExportSource = {
  date: Date;
  mealType: MealType;
  wasteWeightG: number | null;
  wasteWeightMaternelleG?: number | null;
  wasteWeightPrimaireG?: number | null;
  metrics: Array<{
    presentCount: number;
    servedCount: number;
    rabCount: number;
    refusedCount: number;
    group: { name: string; school: { name: string } };
  }>;
};

export type ServiceMetricExportRow = Record<string, string | number>;
export type ServiceWasteSummaryRow = Record<string, string | number | null>;

function gramsOrEmpty(grams: number | null | undefined): string | number {
  return grams != null && grams > 0 ? grams : "";
}

function wasteColumns(service: ServiceExportSource) {
  return {
    "Déchets total (g)": gramsOrEmpty(service.wasteWeightG),
    "Déchets maternelle (g)": gramsOrEmpty(service.wasteWeightMaternelleG),
    "Déchets primaire (g)": gramsOrEmpty(service.wasteWeightPrimaireG),
  };
}

/** Une ligne = une classe / service, colonnes FR pour Excel. */
export function buildServiceMetricExportRows(
  services: ServiceExportSource[],
): ServiceMetricExportRow[] {
  const rows: ServiceMetricExportRow[] = [];

  for (const service of services) {
    const waste = wasteColumns(service);
    const base = {
      Date: formatServiceDateKey(service.date),
      Repas: mealTypeLabelFr(service.mealType),
    };

    if (service.metrics.length === 0) {
      rows.push({
        ...base,
        École: "",
        Classe: "",
        "Libellé classe": "",
        Présents: "",
        Servis: "",
        RAB: "",
        Refus: "",
        ...waste,
      });
      continue;
    }

    for (const metric of service.metrics) {
      rows.push({
        ...base,
        École: metric.group.school.name,
        Classe: metric.group.name,
        "Libellé classe": formatGroupLabel(
          metric.group.school.name,
          metric.group.name,
        ),
        Présents: metric.presentCount,
        Servis: metric.servedCount,
        RAB: metric.rabCount,
        Refus: metric.refusedCount,
        ...waste,
      });
    }
  }

  return rows;
}

/** Une ligne par service ayant un grammage déchets renseigné. */
export function buildServiceWasteSummaryRows(
  services: ServiceExportSource[],
): ServiceWasteSummaryRow[] {
  return services
    .filter((service) => service.wasteWeightG != null && service.wasteWeightG > 0)
    .map((service) => ({
      Date: formatServiceDateKey(service.date),
      Repas: mealTypeLabelFr(service.mealType),
      "Déchets total (g)": service.wasteWeightG,
      "Déchets total (kg)": Math.round((service.wasteWeightG! / 1000) * 100) / 100,
      "Déchets maternelle (g)": gramsOrEmpty(service.wasteWeightMaternelleG) || null,
      "Déchets primaire (g)": gramsOrEmpty(service.wasteWeightPrimaireG) || null,
    }));
}
