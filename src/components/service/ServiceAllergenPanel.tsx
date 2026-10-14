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
    <div className="mt-3 space-y-2">
      {studentsWithAllergens > 0 ? (
        <div className="flex items-start gap-2.5 rounded-xl border-2 border-amber-500 bg-amber-50 px-3 py-2.5 shadow-sm ring-1 ring-amber-600/25 sm:py-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden
          />
          <p className="text-sm leading-snug sm:text-base">
            <span className="font-extrabold text-amber-950">
              {studentsWithAllergens} allergie{studentsWithAllergens > 1 ? "s" : ""}
            </span>
            {hasMenu ? (
              <>
                <span className="font-bold text-amber-900/80"> · </span>
                <span
                  className={
                    affectedByMenu > 0
                      ? "font-extrabold text-rose-800 underline decoration-rose-400/80 decoration-2 underline-offset-2"
                      : "font-bold text-amber-900"
                  }
                >
                  {affectedByMenu} concerné{affectedByMenu > 1 ? "s" : ""} menu
                </span>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
      {studentsNoPork > 0 || studentsVegetarian > 0 ? (
        <div className="rounded-xl border-2 border-zinc-900 bg-white px-3 py-2.5 shadow-sm ring-1 ring-zinc-900/10 sm:py-3">
          <p className="text-sm font-extrabold leading-snug text-zinc-900 sm:text-base">
            {studentsNoPork > 0 ? (
              <span className="text-zinc-950">{studentsNoPork} sans porc</span>
            ) : null}
            {studentsNoPork > 0 && studentsVegetarian > 0 ? (
              <span className="font-bold text-zinc-500"> · </span>
            ) : null}
            {studentsVegetarian > 0 ? (
              <span className="text-zinc-950">
                {studentsVegetarian} végétarien{studentsVegetarian > 1 ? "s" : ""}
              </span>
            ) : null}
            {hasMenu && dietAffectedByMenu > 0 ? (
              <>
                <span className="font-bold text-zinc-500"> · </span>
                <span className="text-rose-800 underline decoration-rose-500/70 decoration-2 underline-offset-2">
                  {dietAffectedByMenu} à adapter
                </span>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}
