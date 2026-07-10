import type { MealType } from "@/generated/prisma/client";
import { formatGroupLabel } from "@/lib/groupLabel";
import { mealTypeLabelFr } from "@/lib/mealType";
import { formatServiceDateKey } from "@/lib/serviceDate";

export type ServiceExportSource = {
  date: Date;
  mealType: MealType;
  wasteWeightG: number | null;
  metrics: Array<{
    presentCount: number;
    servedCount: number;
    rabCount: number;
    refusedCount: number;
    leftoversCount: number;
    group: { name: string; school: { name: string } };
  }>;
};

export function buildServiceMetricExportRows(services: ServiceExportSource[]) {
  return services.flatMap((service) => {
    const wasteWeightG = service.wasteWeightG ?? "";

    if (service.metrics.length === 0) {
      return [
        {
          date: formatServiceDateKey(service.date),
          mealType: service.mealType,
          school: "",
          group: "",
          groupLabel: "",
          presentCount: "",
          servedCount: "",
          rabCount: "",
          refusedCount: "",
          leftoversCount: "",
          wasteWeightG,
        },
      ];
    }

    return service.metrics.map((metric) => ({
      date: formatServiceDateKey(service.date),
      mealType: service.mealType,
      school: metric.group.school.name,
      group: metric.group.name,
      groupLabel: formatGroupLabel(metric.group.school.name, metric.group.name),
      presentCount: metric.presentCount,
      servedCount: metric.servedCount,
      rabCount: metric.rabCount,
      refusedCount: metric.refusedCount,
      leftoversCount: metric.leftoversCount,
      wasteWeightG,
    }));
  });
}

/** Une ligne par service ayant un grammage déchets renseigné. */
export function buildServiceWasteSummaryRows(services: ServiceExportSource[]) {
  return services
    .filter((service) => service.wasteWeightG != null && service.wasteWeightG > 0)
    .map((service) => ({
      date: formatServiceDateKey(service.date),
      mealType: service.mealType,
      repas: mealTypeLabelFr(service.mealType),
      wasteWeightG: service.wasteWeightG,
      wasteWeightKg: Math.round((service.wasteWeightG! / 1000) * 100) / 100,
    }));
}
