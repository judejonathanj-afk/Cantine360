"use client";

import { useMemo } from "react";
import { useQueuedMetrics } from "@/hooks/useQueuedMetrics";
import { overlayQueuedCounts } from "@/lib/mergeQueuedMetrics";
import {
  buildLevelPortionSuggestions,
  type AntiWasteKitchenAdvice,
} from "@/lib/antiWasteKitchenAdvice";
import { formatKgFromGrams } from "@/lib/serviceGrammage";

export type LiveKitchenAdviceClassCount = {
  groupId: string;
  level: "MATERNELLE" | "PRIMAIRE";
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
};

export function useLiveKitchenAdvice(
  kitchenAdvice: AntiWasteKitchenAdvice | null | undefined,
  serviceId: string,
  classCounts: LiveKitchenAdviceClassCount[] | undefined,
): AntiWasteKitchenAdvice | null {
  const queued = useQueuedMetrics(serviceId);

  return useMemo(() => {
    if (!kitchenAdvice) return null;
    if (!classCounts || classCounts.length === 0) return kitchenAdvice;

    const rows = overlayQueuedCounts(classCounts, queued);
    const portions = buildLevelPortionSuggestions(
      kitchenAdvice.perPlateBase,
      rows.map((row) => ({
        level: row.level,
        presentCount: row.presentCount,
        servedCount: row.servedCount,
      })),
    );
    const total = portions.reduce((sum, portion) => sum + (portion.plannedGrams ?? 0), 0);
    const hasPlanned = portions.some(
      (portion) => portion.plannedGrams != null && portion.plannedGrams > 0,
    );

    return {
      ...kitchenAdvice,
      portions,
      totalPlannedGrams: hasPlanned ? total : null,
      totalPlannedKgLabel: hasPlanned ? formatKgFromGrams(total) : null,
    };
  }, [classCounts, kitchenAdvice, queued]);
}
