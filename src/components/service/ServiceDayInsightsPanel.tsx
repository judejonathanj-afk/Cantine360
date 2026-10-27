"use client";

import { useState, type ReactNode } from "react";
import type { AntiWasteKitchenAdvice } from "@/lib/antiWasteKitchenAdvice";
import type { SchoolLevel } from "@/lib/schoolLevel";
import type {
  MenuItemGrammage,
  ServiceMetricsGrammage,
} from "@/lib/serviceGrammage";
import type { ServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import type { LiveKitchenAdviceClassCount } from "@/hooks/useLiveKitchenAdvice";
import { ServiceDietBanner } from "@/components/service/ServiceDietBanner";
import {
  ServiceDietStudentsExpandedContent,
  ServiceDietStudentsTrigger,
  useDietStudentsList,
} from "@/components/service/ServiceDietStudentsPanel";
import { ServiceGrammagePanel } from "@/components/service/ServiceGrammagePanel";
import { ServiceAntiWasteInsightPanel } from "@/components/service/ServiceAntiWasteInsightPanel";
import { Collapsible } from "@/components/ui/collapsible";
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
  const [dietDetailOpen, setDietDetailOpen] = useState(false);

  const showDiet =
    allergenSummary != null &&
    (allergenSummary.totalNoPork > 0 || allergenSummary.totalVegetarian > 0);
  const showAntiWaste = antiWasteModeEnabled && kitchenAdvice != null;

  const dietList = useDietStudentsList({
    groups: allergenSummary?.groups ?? [],
    hasMenu: allergenSummary?.hasMenu ?? false,
    groupLevelById,
  });

  const insightsGrid = (
    <InsightsGrid
      showDiet={showDiet}
      showAntiWaste={showAntiWaste}
      allergenSummary={allergenSummary}
      serviceId={serviceId}
      menuItems={menuItems}
      metricsGrammage={metricsGrammage}
      kitchenAdvice={kitchenAdvice}
      classCounts={classCounts}
      initialWasteWeightG={initialWasteWeightG}
      initialWasteWeightMaternelleG={initialWasteWeightMaternelleG}
      initialWasteWeightPrimaireG={initialWasteWeightPrimaireG}
    />
  );

  if (dietList.visible) {
    return (
      <section
        aria-label="Régimes à adapter"
        className="mx-auto max-w-6xl px-1 sm:px-2"
      >
        <Collapsible
          open={dietDetailOpen}
          onOpenChange={setDietDetailOpen}
          id="regimes-a-adapter"
        >
          <div
            className={cn(
              dietDetailOpen &&
                "overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_14px_40px_rgba(24,24,27,0.08)]",
            )}
          >
            <div
              className={cn(
                "flex justify-center",
                dietDetailOpen && "px-4 pt-4 pb-2 sm:px-5",
              )}
            >
              <ServiceDietStudentsTrigger
                total={dietList.total}
                open={dietDetailOpen}
              />
            </div>
            {dietDetailOpen ? (
              <hr
                className="mx-4 mb-1 h-1 rounded-full border-0 bg-[#FDEE5A] sm:mx-5"
                aria-hidden
              />
            ) : null}
            {dietDetailOpen ? insightsGrid : null}
            <ServiceDietStudentsExpandedContent
              list={dietList.list}
              className={cn(
                "rounded-b-[19px] border-x-0 border-b-0 px-4 sm:px-5",
              )}
            />
          </div>
        </Collapsible>
      </section>
    );
  }

  return (
    <section
      aria-label="Repères du service — grammage et antigaspillage"
      className="mx-auto max-w-6xl overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_14px_40px_rgba(24,24,27,0.08)]"
    >
      {insightsGrid}
    </section>
  );
}

function InsightsGrid({
  showDiet,
  showAntiWaste,
  allergenSummary,
  serviceId,
  menuItems,
  metricsGrammage,
  kitchenAdvice,
  classCounts,
  initialWasteWeightG,
  initialWasteWeightMaternelleG,
  initialWasteWeightPrimaireG,
}: {
  showDiet: boolean;
  showAntiWaste: boolean;
  allergenSummary: ServiceAllergenSummary | null;
  serviceId: string;
  menuItems: MenuItemGrammage[];
  metricsGrammage: ServiceMetricsGrammage[];
  kitchenAdvice: AntiWasteKitchenAdvice | null;
  classCounts: LiveKitchenAdviceClassCount[];
  initialWasteWeightG: number | null;
  initialWasteWeightMaternelleG?: number | null;
  initialWasteWeightPrimaireG?: number | null;
}) {
  const columnCount = (showDiet ? 1 : 0) + 1 + (showAntiWaste ? 1 : 0);
  const children: ReactNode[] = [];

  if (showDiet && allergenSummary) {
    children.push(
      <div key="diet" className="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
        <ServiceDietBanner summary={allergenSummary} embedded className="h-auto" />
      </div>,
    );
  }

  children.push(
    <div key="grammage" className="min-w-0 p-4 sm:p-5">
      <ServiceGrammagePanel
        serviceId={serviceId}
        menuItems={menuItems}
        metrics={metricsGrammage}
        embedded
        className="h-auto"
      />
    </div>,
  );

  if (showAntiWaste && kitchenAdvice) {
    children.push(
      <div key="antiwaste" className="min-w-0 p-4 sm:p-5">
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
      </div>,
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 divide-y divide-zinc-200/80",
        columnCount >= 2 && "md:grid-cols-2 md:divide-x md:divide-y-0",
        columnCount === 3 && "lg:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}
