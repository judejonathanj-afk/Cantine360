"use client";

import type { AntiWasteKitchenAdvice } from "@/lib/antiWasteKitchenAdvice";
import type { SchoolLevel } from "@/lib/schoolLevel";
import type {
  MenuItemGrammage,
  ServiceMetricsGrammage,
} from "@/lib/serviceGrammage";
import type { ServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import type { LiveKitchenAdviceClassCount } from "@/hooks/useLiveKitchenAdvice";
import { ServiceDietBanner } from "@/components/service/ServiceDietBanner";
import { ServiceDietStudentsPanel } from "@/components/service/ServiceDietStudentsPanel";
import { ServiceGrammagePanel } from "@/components/service/ServiceGrammagePanel";
import { ServiceAntiWasteInsightPanel } from "@/components/service/ServiceAntiWasteInsightPanel";
import { cn } from "@/lib/utils";

export function ServiceDayInsightsPanel({
  serviceId,
  allergenSummary,
  groupLevelById,
  menuItems,
  metricsGrammage,
  antiWasteModeEnabled,
  kitchenAdvice,
  classCounts,
  initialWasteWeightG,
  initialWasteWeightMaternelleG,
  initialWasteWeightPrimaireG,
}: {
  serviceId: string;
  allergenSummary: ServiceAllergenSummary | null;
  groupLevelById: Record<string, SchoolLevel>;
  menuItems: MenuItemGrammage[];
  metricsGrammage: ServiceMetricsGrammage[];
  antiWasteModeEnabled: boolean;
  kitchenAdvice: AntiWasteKitchenAdvice | null;
  classCounts: LiveKitchenAdviceClassCount[];
  initialWasteWeightG: number | null;
  initialWasteWeightMaternelleG?: number | null;
  initialWasteWeightPrimaireG?: number | null;
}) {
  const showDiet =
    allergenSummary != null &&
    (allergenSummary.totalNoPork > 0 || allergenSummary.totalVegetarian > 0);
  const showAntiWaste = antiWasteModeEnabled && kitchenAdvice != null;

  const columnCount = (showDiet ? 1 : 0) + 1 + (showAntiWaste ? 1 : 0);

  return (
    <section
      aria-label="Repères du service — régimes, grammage et antigaspillage"
      className="mx-auto max-w-6xl overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_14px_40px_rgba(24,24,27,0.08)]"
    >
      <div
        className={cn(
          "grid grid-cols-1 divide-y divide-zinc-200/80",
          columnCount >= 2 && "md:grid-cols-2 md:divide-x md:divide-y-0",
          columnCount === 3 && "lg:grid-cols-3",
        )}
      >
        {showDiet && allergenSummary ? (
          <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
            <ServiceDietBanner summary={allergenSummary} embedded className="h-auto" />
            {allergenSummary.totalDietAffected > 0 ? (
              <ServiceDietStudentsPanel
                groups={allergenSummary.groups}
                hasMenu={allergenSummary.hasMenu}
                groupLevelById={groupLevelById}
              />
            ) : null}
          </div>
        ) : null}

        <div className="min-w-0 p-4 sm:p-5">
          <ServiceGrammagePanel
            serviceId={serviceId}
            menuItems={menuItems}
            metrics={metricsGrammage}
            embedded
            className="h-auto"
          />
        </div>

        {showAntiWaste && kitchenAdvice ? (
          <div className="min-w-0 p-4 sm:p-5">
            <ServiceAntiWasteInsightPanel
              serviceId={serviceId}
              kitchenAdvice={kitchenAdvice}
              classCounts={classCounts}
              initialWasteWeightG={initialWasteWeightG}
              initialWasteWeightMaternelleG={initialWasteWeightMaternelleG}
              initialWasteWeightPrimaireG={initialWasteWeightPrimaireG}
              embedded
              className="h-auto"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
