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

  if (!summary.hasGrammage) {
    return (
      <ServiceInsightCard
        tone="sky"
        icon={Scale}
        title="Grammage du service"
        subtitle="Non renseigné"
        metric="—"
        className={className}
        compact
      >
        Ajoutez les grammes par plat dans <strong className="font-semibold">Menu & allergènes</strong>.
      </ServiceInsightCard>
    );
  }

  return (
    <ServiceInsightCard
      tone="sky"
      icon={Scale}
      title="Grammage du service"
      subtitle={`${summary.perPlate} g / assiette complète`}
      metric={
        summary.basisCount > 0 ? (
          <>
            {formatKgFromGrams(summary.plannedGrams)}
            <span className="ml-1 text-lg font-semibold">prévus</span>
          </>
        ) : (
          `${summary.perPlate} g`
        )
      }
      className={cn(className)}
      compact
    >
      {summary.basisCount > 0 ? (
        <p>
          Sur {summary.basisCount} {summary.basisLabel}
          {summary.totalRab > 0 ? (
            <>
              {" "}
              · RAB {summary.totalRab}
              {summary.rabGrams > 0 ? ` (~${formatKgFromGrams(summary.rabGrams)})` : null}
            </>
          ) : null}
        </p>
      ) : (
        <p>Saisissez les présents ou servis par classe.</p>
      )}
      <ul className="mt-2 space-y-0.5 text-sm">
        {summary.itemsWithGrammage.map((i) => (
          <li key={`${i.category}-${i.label}`}>
            {i.label} — {i.grammageG} g
          </li>
        ))}
      </ul>
    </ServiceInsightCard>
  );
}
