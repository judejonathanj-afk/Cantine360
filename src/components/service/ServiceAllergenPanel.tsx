import type { GroupAllergenSummary, ServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { AlertTriangle } from "lucide-react";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { cn } from "@/lib/utils";

export function ServiceAllergenOverview({
  summary,
  className,
}: {
  summary: ServiceAllergenSummary;
  className?: string;
}) {
  if (summary.groups.every((g) => g.studentsTotal === 0)) {
    return (
      <ServiceInsightCard
        tone="amber"
        icon={AlertTriangle}
        title="Allergènes — menu du jour"
        subtitle="Aucun élève enregistré"
        className={className}
        compact
      >
        L’admin peut importer la liste (Admin → Élèves & allergènes).
      </ServiceInsightCard>
    );
  }

  const topDish = summary.dishes.find((d) => d.affectedStudents > 0);

  return (
    <ServiceInsightCard
      tone="amber"
      icon={AlertTriangle}
      title="Allergènes — menu du jour"
      subtitle={
        !summary.hasMenu
          ? "Menu non renseigné"
          : `${summary.menuAllergensCount} allergène${summary.menuAllergensCount > 1 ? "s" : ""} sur les plats`
      }
      metric={
        summary.hasMenu ? (
          <>
            {summary.totalAffectedStudents}
            <span className="ml-1 text-lg font-semibold">élève{summary.totalAffectedStudents > 1 ? "s" : ""}</span>
          </>
        ) : (
          "—"
        )
      }
      className={cn(className)}
      compact
    >
      {!summary.hasMenu ? (
        <p>Complétez le menu pour voir les élèves concernés.</p>
      ) : topDish ? (
        <p>
          <strong className="font-semibold">{topDish.label}</strong> — {topDish.affectedStudents}{" "}
          élève{topDish.affectedStudents > 1 ? "s" : ""}
          {summary.dishes.filter((d) => d.affectedStudents > 0).length > 1
            ? ` (+${summary.dishes.filter((d) => d.affectedStudents > 0).length - 1} plat${summary.dishes.filter((d) => d.affectedStudents > 0).length > 2 ? "s" : ""})`
            : null}
        </p>
      ) : (
        <p>Aucun élève concerné par le menu actuel.</p>
      )}
    </ServiceInsightCard>
  );
}

export function GroupAllergenBadge({
  groupSummary,
  hasMenu,
}: {
  groupSummary: GroupAllergenSummary | undefined;
  hasMenu: boolean;
}) {
  if (!groupSummary) return null;

  const { studentsWithAllergens, affectedByMenu, studentsNoPork, studentsVegetarian, dietAffectedByMenu } =
    groupSummary;

  if (studentsWithAllergens === 0 && studentsNoPork === 0 && studentsVegetarian === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-1.5">
      {studentsWithAllergens > 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm sm:text-base">
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-yellow-500"
            aria-hidden
          />
          <span>
            <span>
              {studentsWithAllergens} allergie{studentsWithAllergens > 1 ? "s" : ""}
            </span>
            {hasMenu ? (
              <span className="font-medium text-zinc-600">
                {" "}
                ·{" "}
                <span className={affectedByMenu > 0 ? "font-bold text-amber-900" : ""}>
                  {affectedByMenu} concerné{affectedByMenu > 1 ? "s" : ""} menu
                </span>
              </span>
            ) : null}
          </span>
        </div>
      ) : null}
      {studentsNoPork > 0 || studentsVegetarian > 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm">
          <span>
            {studentsNoPork > 0 ? `${studentsNoPork} sans porc` : null}
            {studentsNoPork > 0 && studentsVegetarian > 0 ? " · " : null}
            {studentsVegetarian > 0
              ? `${studentsVegetarian} végétarien${studentsVegetarian > 1 ? "s" : ""}`
              : null}
            {hasMenu && dietAffectedByMenu > 0 ? (
              <span className="font-bold text-sky-900">
                {" "}
                · {dietAffectedByMenu} à adapter
              </span>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
