import type { ServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { Salad } from "lucide-react";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { cn } from "@/lib/utils";

export function ServiceDietBanner({
  summary,
  className,
}: {
  summary: ServiceAllergenSummary;
  className?: string;
}) {
  if (summary.totalNoPork === 0 && summary.totalVegetarian === 0) return null;

  const classesTouched = summary.groups.filter((g) => g.dietAffectedByMenu > 0);

  return (
    <ServiceInsightCard
      tone="black"
      icon={Salad}
      title="Régimes — menu du jour"
      subtitle={
        !summary.hasMenu
          ? "Menu non renseigné"
          : summary.totalDietAffected > 0
            ? `${summary.totalDietAffected} élève${summary.totalDietAffected > 1 ? "s" : ""} à adapter`
            : "Aucun plat conflictuel aujourd’hui"
      }
      metric={
        <>
          {summary.totalNoPork}
          <span className="ml-1 text-lg font-semibold">sans porc</span>
          <span className="mx-1.5 text-white/70">·</span>
          {summary.totalVegetarian}
          <span className="ml-1 text-lg font-semibold">végétarien{summary.totalVegetarian > 1 ? "s" : ""}</span>
        </>
      }
      className={cn(className)}
      compact
    >
      {!summary.hasMenu ? (
        <p>Complétez le menu (cochez porc / viande sur les plats) pour voir les adaptations.</p>
      ) : classesTouched.length > 0 ? (
        <p>
          {classesTouched
            .slice(0, 4)
            .map((g) => `${g.className} (${g.dietAffectedByMenu})`)
            .join(" · ")}
          {classesTouched.length > 4
            ? ` · +${classesTouched.length - 4} classe${classesTouched.length - 4 > 1 ? "s" : ""}`
            : null}
        </p>
      ) : (
        <p>Les régimes sont enregistrés ; aucun plat du jour n’est signalé porc ou viande.</p>
      )}
    </ServiceInsightCard>
  );
}
