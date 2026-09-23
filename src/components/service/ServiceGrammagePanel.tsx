import { Scale } from "lucide-react";
import {
  computeServiceGrammageSummary,
  formatKgFromGrams,
  type MenuItemGrammage,
  type ServiceMetricsGrammage,
} from "@/lib/serviceGrammage";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { cn } from "@/lib/utils";

export function ServiceGrammagePanel({
  menuItems,
  metrics,
  className,
}: {
  menuItems: MenuItemGrammage[];
  metrics: ServiceMetricsGrammage[];
  className?: string;
}) {
  const summary = computeServiceGrammageSummary(menuItems, metrics);

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
