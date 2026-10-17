import type { ServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { Salad } from "lucide-react";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { cn } from "@/lib/utils";

export function ServiceDietBanner({
  summary,
  className,
  embedded = false,
}: {
  summary: ServiceAllergenSummary;
  className?: string;
  embedded?: boolean;
}) {
  if (summary.totalNoPork === 0 && summary.totalVegetarian === 0) return null;

  const classesTouched = summary.groups.filter((g) => g.dietAffectedByMenu > 0);

  return (
    <ServiceInsightCard
      tone="soft"
      dense
      embedded={embedded}
      icon={Salad}
      title="Régimes (menu)"
      subtitle={
        !summary.hasMenu
          ? "Menu non renseigné"
          : summary.totalDietAffected > 0
            ? `${summary.totalDietAffected} élève${summary.totalDietAffected > 1 ? "s" : ""} à adapter`
            : "Aucun plat conflictuel aujourd’hui"
      }
      metric={
        <span className="text-lg font-extrabold">
          {summary.totalNoPork} sans porc · {summary.totalVegetarian} végét.
        </span>
      }
      className={cn(className)}
    >
      {!summary.hasMenu ? (
        <p>Complétez le menu (cochez porc / viande sur les plats) pour voir les adaptations.</p>
      ) : classesTouched.length > 0 ? (
        <p>
          {classesTouched.map((g, index) => (
            <span key={g.groupId}>
              {index > 0 ? " · " : null}
              <strong className="font-bold">
                {g.className} ({g.dietAffectedByMenu})
              </strong>
            </span>
          ))}
        </p>
      ) : (
        <p>Les régimes sont enregistrés ; aucun plat du jour n’est signalé porc ou viande.</p>
      )}
    </ServiceInsightCard>
  );
}
