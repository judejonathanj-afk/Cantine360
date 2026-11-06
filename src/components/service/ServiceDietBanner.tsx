import type { ServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { Salad } from "lucide-react";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { cn } from "@/lib/utils";
import { DIET_KEYS, DIET_META, type DietKey } from "@/lib/dietaryRegime";

export function ServiceDietBanner({
  summary,
  className,
  embedded = false,
}: {
  summary: ServiceAllergenSummary;
  className?: string;
  embedded?: boolean;
}) {
  const dietTotals = Object.fromEntries(
    DIET_KEYS.map((key) => [
      key,
      summary.groups.reduce(
        (n, g) => n + g.students.filter((s) => s[key]).length,
        0,
      ),
    ]),
  ) as Record<DietKey, number>;
  if (DIET_KEYS.every((key) => dietTotals[key] === 0)) return null;

  const classesTouched = summary.groups.filter((g) => g.dietAffectedByMenu > 0);
  const metricLabel = DIET_KEYS.filter((key) => dietTotals[key] > 0)
    .map(
      (key) =>
        `${dietTotals[key]} ${dietTotals[key] > 1 ? DIET_META[key].labelPlural : DIET_META[key].label.toLowerCase()}`,
    )
    .join(" · ");

  return (
    <ServiceInsightCard
      tone="soft"
      dense={!embedded}
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
        <span className="text-xl font-extrabold">
          {metricLabel}
        </span>
      }
      className={cn(className)}
    >
      {!summary.hasMenu ? (
        <p>Complétez le menu (porc, viande, bœuf, poisson) pour voir les adaptations.</p>
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
        <p>Les régimes sont enregistrés ; aucun plat du jour n’est en conflit.</p>
      )}
    </ServiceInsightCard>
  );
}
