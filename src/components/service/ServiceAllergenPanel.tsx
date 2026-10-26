import type {
  GroupAllergenSummary,
  ServiceAllergenSummary,
  StudentAllergenRow,
} from "@/server/serviceAllergenSummary";
import { AlertTriangle } from "lucide-react";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { formatStudentKitchenName } from "@/lib/studentDisplayName";
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

const PREVIEW_STUDENTS: Array<
  Pick<
    StudentAllergenRow,
    | "firstName"
    | "lastName"
    | "allergens"
    | "noPork"
    | "vegetarian"
    | "affectedDishes"
    | "dietDishes"
  >
> = [
  {
    firstName: "Hugo",
    lastName: "Bernard",
    allergens: ["Arachides"],
    noPork: false,
    vegetarian: false,
    affectedDishes: ["lasagnes maison"],
    dietDishes: [],
  },
  {
    firstName: "Emma",
    lastName: "Petit",
    allergens: ["Œufs"],
    noPork: false,
    vegetarian: true,
    affectedDishes: ["yaourt"],
    dietDishes: ["lasagnes maison"],
  },
  {
    firstName: "Louis",
    lastName: "Moreau",
    allergens: ["Lait"],
    noPork: true,
    vegetarian: false,
    affectedDishes: ["yaourt"],
    dietDishes: [],
  },
  {
    firstName: "Chloé",
    lastName: "Lefevre",
    allergens: ["Fruits à coque"],
    noPork: false,
    vegetarian: false,
    affectedDishes: ["lasagnes maison"],
    dietDishes: [],
  },
  {
    firstName: "Gabriel",
    lastName: "Roux",
    allergens: ["Poisson"],
    noPork: false,
    vegetarian: false,
    affectedDishes: [],
    dietDishes: [],
  },
  {
    firstName: "Inès",
    lastName: "Garcia",
    allergens: ["Soja"],
    noPork: false,
    vegetarian: true,
    affectedDishes: ["yaourt"],
    dietDishes: ["lasagnes maison"],
  },
];

function padPreviewStudents(
  rows: StudentAllergenRow[],
  group: GroupAllergenSummary,
): StudentAllergenRow[] {
  if (rows.length >= 8) return rows;
  const extras: StudentAllergenRow[] = PREVIEW_STUDENTS.map((preview, index) => ({
    id: `preview-${group.groupId}-${index}`,
    firstName: preview.firstName,
    lastName: preview.lastName,
    allergens: preview.allergens,
    allergenNotes: null,
    schoolName: group.schoolName,
    className: group.className,
    groupLabel: group.groupLabel,
    noPork: preview.noPork,
    vegetarian: preview.vegetarian,
    affectedByMenu: preview.affectedDishes.length > 0,
    affectedDishes: preview.affectedDishes,
    dietAffectedByMenu: preview.dietDishes.length > 0,
    dietDishes: preview.dietDishes,
  }));
  return [...rows, ...extras].slice(0, 8);
}

export function GroupAllergenBadge({
  groupSummary,
  hasMenu,
}: {
  groupSummary: GroupAllergenSummary | undefined;
  hasMenu: boolean;
}) {
  if (!groupSummary) return null;

  const {
    students,
    studentsWithAllergens,
    affectedByMenu,
    studentsNoPork,
    studentsVegetarian,
    dietAffectedByMenu,
  } = groupSummary;

  if (studentsWithAllergens === 0 && studentsNoPork === 0 && studentsVegetarian === 0) {
    return null;
  }

  const summaryParts: string[] = [];
  if (studentsWithAllergens > 0) {
    summaryParts.push(
      `${studentsWithAllergens} allergie${studentsWithAllergens > 1 ? "s" : ""}`,
    );
  }
  if (hasMenu) {
    summaryParts.push(
      `${affectedByMenu} concerné${affectedByMenu > 1 ? "s" : ""} par le menu`,
    );
  }
  if (studentsNoPork > 0) {
    summaryParts.push(`${studentsNoPork} sans porc`);
  }
  if (studentsVegetarian > 0) {
    summaryParts.push(
      `${studentsVegetarian} végétarien${studentsVegetarian > 1 ? "s" : ""}`,
    );
  }
  if (hasMenu && dietAffectedByMenu > 0) {
    summaryParts.push(`${dietAffectedByMenu} assiette${dietAffectedByMenu > 1 ? "s" : ""} à adapter`);
  }

  const detailRows = padPreviewStudents(
    students.filter(
      (student) =>
        student.allergens.length > 0 ||
        student.noPork ||
        student.vegetarian ||
        student.affectedByMenu ||
        student.dietAffectedByMenu,
    ),
    groupSummary,
  );

  return (
    <div className="mt-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-left text-base font-extrabold text-zinc-950 sm:text-lg">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        Allergies et régimes
      </p>
      <div className="rounded-xl border-2 border-amber-500 bg-white px-3 py-3 shadow-sm ring-1 ring-amber-600/20">
      <p className="text-base font-bold leading-snug text-zinc-950">
        {summaryParts.join(" · ")}
      </p>
      {detailRows.length > 0 ? (
        <ul className="mt-2.5 max-h-[7.5rem] space-y-1.5 overflow-y-scroll overscroll-contain pr-2 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-200">
          {detailRows.map((student) => {
            const phrases: string[] = [];
            if (student.allergens.length > 0) {
              const note = student.allergenNotes?.trim();
              phrases.push(
                note
                  ? `${student.allergens.join(", ")} — ${note}`
                  : `à ne pas servir : ${student.allergens.join(", ")}`,
              );
            }
            if (student.noPork) {
              phrases.push("sans porc — ne pas servir de porc");
            }
            if (student.vegetarian) {
              phrases.push("végétarien — adapter l’assiette");
            }
            const dishes = [
              ...new Set([...student.affectedDishes, ...student.dietDishes]),
            ];
            if (dishes.length > 0) {
              phrases.push(`plats à ne pas servir / à adapter : ${dishes.join(", ")}`);
            }
            const lines = phrases.map((phrase) => `${phrase}.`);
            return (
              <li
                key={student.id}
                className="rounded-lg bg-amber-50/80 px-2.5 py-1.5 text-base leading-snug text-zinc-800"
              >
                <p>
                  <span className="mr-1.5 inline-flex rounded-full bg-black px-2.5 py-0.5 text-base font-extrabold text-white">
                    {formatStudentKitchenName(student.firstName, student.lastName)}
                  </span>
                  {lines[0] ? (
                    <span className="font-bold text-zinc-950">{lines[0]}</span>
                  ) : null}
                </p>
                {lines.slice(1).map((line) => (
                  <p key={line} className="mt-0.5 font-bold text-zinc-950">
                    {line}
                  </p>
                ))}
              </li>
            );
          })}
        </ul>
      ) : null}
      </div>
    </div>
  );
}
