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
    wasteWeightG: gramsOrEmpty(service.wasteWeightG),
    wasteWeightMaternelleG: gramsOrEmpty(service.wasteWeightMaternelleG),
    wasteWeightPrimaireG: gramsOrEmpty(service.wasteWeightPrimaireG),
  };
}

export function buildServiceMetricExportRows(
  services: ServiceExportSource[],
): ServiceMetricExportRow[] {
  const rows: ServiceMetricExportRow[] = [];

  for (const service of services) {
    const waste = wasteColumns(service);

    if (service.metrics.length === 0) {
      rows.push({
        date: formatServiceDateKey(service.date),
        mealType: service.mealType,
        school: "",
        group: "",
        groupLabel: "",
        presentCount: "",
        servedCount: "",
        rabCount: "",
        refusedCount: "",
        ...waste,
      });
      continue;
    }

    for (const metric of service.metrics) {
      rows.push({
        date: formatServiceDateKey(service.date),
        mealType: service.mealType,
        school: metric.group.school.name,
        group: metric.group.name,
        groupLabel: formatGroupLabel(metric.group.school.name, metric.group.name),
        presentCount: metric.presentCount,
        servedCount: metric.servedCount,
        rabCount: metric.rabCount,
        refusedCount: metric.refusedCount,
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
      date: formatServiceDateKey(service.date),
      mealType: service.mealType,
      repas: mealTypeLabelFr(service.mealType),
      wasteWeightG: service.wasteWeightG,
      wasteWeightKg: Math.round((service.wasteWeightG! / 1000) * 100) / 100,
      wasteWeightMaternelleG: gramsOrEmpty(service.wasteWeightMaternelleG) || null,
      wasteWeightPrimaireG: gramsOrEmpty(service.wasteWeightPrimaireG) || null,
    }));
}
