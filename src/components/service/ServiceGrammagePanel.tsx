"use client";

import { useMemo } from "react";
import { Scale } from "lucide-react";
import { useQueuedMetrics } from "@/hooks/useQueuedMetrics";
import { overlayQueuedCounts } from "@/lib/mergeQueuedMetrics";
import {
  computeServiceGrammageSummary,
  formatKgFromGrams,
  type MenuItemGrammage,
  type ServiceMetricsGrammage,
} from "@/lib/serviceGrammage";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { cn } from "@/lib/utils";

export function ServiceGrammagePanel({
  serviceId,
  menuItems,
  metrics,
  className,
}: {
  serviceId?: string;
  menuItems: MenuItemGrammage[];
  metrics: ServiceMetricsGrammage[];
  className?: string;
}) {
  const queued = useQueuedMetrics(serviceId ?? "");
  const live = useMemo(() => {
    const rows = metrics.map((m, index) => ({
      groupId: m.groupId ?? `__${index}`,
      presentCount: m.presentCount,
      servedCount: m.servedCount,
      rabCount: m.rabCount,
      refusedCount: m.refusedCount ?? 0,
    }));
    if (!serviceId) return rows;
    return overlayQueuedCounts(rows, queued);
  }, [metrics, queued, serviceId]);
  const summary = computeServiceGrammageSummary(menuItems, live);

  return (
    <ServiceInsightCard
      tone="black"
      icon={Scale}
      title="Grammage du service"
      subtitle={
        summary.hasGrammage
          ? summary.basisCount > 0
            ? `${formatKgFromGrams(summary.plannedGrams)} prévus · ${summary.basisCount} ${summary.basisLabel}`
            : "Grammes par assiette"
          : "Menu sans grammage"
      }
      metric={
        summary.hasGrammage ? (
          <>
            {summary.perPlate}
            <span className="ml-1 text-lg font-semibold">g / assiette</span>
          </>
        ) : (
          "—"
        )
      }
      className={cn(className)}
      compact
    >
      {!summary.hasGrammage ? (
        <p>Ajoutez les grammes dans Menu &amp; allergènes.</p>
      ) : (
        <p>
          {summary.itemsWithGrammage
            .map((i) => `${i.label} — ${i.grammageG} g`)
            .join(" · ")}
        </p>
      )}
    </ServiceInsightCard>
  );
}
