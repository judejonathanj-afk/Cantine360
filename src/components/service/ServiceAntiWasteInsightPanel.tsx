"use client";

import { useEffect, useState } from "react";
import {
  useLiveKitchenAdvice,
  type LiveKitchenAdviceClassCount,
} from "@/hooks/useLiveKitchenAdvice";
import type { AntiWasteKitchenAdvice } from "@/lib/antiWasteKitchenAdvice";
import { totalWasteFromLevels } from "@/lib/serviceWasteByLevel";
import { AntiWasteServiceBanner } from "@/components/service/AntiWasteServiceBanner";
import { cn } from "@/lib/utils";

const WASTE_SAVED_EVENT = "cantine:waste-saved";

function hasSavedWaste(
  maternelleG: number | null | undefined,
  primaireG: number | null | undefined,
  totalG: number | null | undefined,
): boolean {
  const fromLevels = totalWasteFromLevels(maternelleG ?? null, primaireG ?? null);
  if (fromLevels != null && fromLevels > 0) return true;
  return totalG != null && totalG > 0;
}

export function ServiceAntiWasteInsightPanel({
  serviceId,
  kitchenAdvice,
  classCounts,
  initialWasteWeightG,
  initialWasteWeightMaternelleG,
  initialWasteWeightPrimaireG,
  className,
}: {
  serviceId: string;
  kitchenAdvice: AntiWasteKitchenAdvice;
  classCounts: LiveKitchenAdviceClassCount[];
  initialWasteWeightG: number | null;
  initialWasteWeightMaternelleG?: number | null;
  initialWasteWeightPrimaireG?: number | null;
  className?: string;
}) {
  const liveAdvice = useLiveKitchenAdvice(kitchenAdvice, serviceId, classCounts);
  const [asConclusion, setAsConclusion] = useState(() =>
    hasSavedWaste(
      initialWasteWeightMaternelleG,
      initialWasteWeightPrimaireG,
      initialWasteWeightG,
    ),
  );

  useEffect(() => {
    const onSaved = (event: Event) => {
      const detail = (event as CustomEvent<{ serviceId?: string }>).detail;
      if (detail?.serviceId === serviceId) setAsConclusion(true);
    };
    window.addEventListener(WASTE_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(WASTE_SAVED_EVENT, onSaved);
  }, [serviceId]);

  if (!liveAdvice) return null;

  return (
    <AntiWasteServiceBanner
      advice={liveAdvice}
      asConclusion={asConclusion}
      variant="compact"
      className={cn(className)}
    />
  );
}

export { WASTE_SAVED_EVENT };
