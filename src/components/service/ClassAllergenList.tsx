import type { StudentAllergenRow } from "@/server/serviceAllergenSummary";
import { ShieldAlert } from "lucide-react";
import { CantinePlusBadge } from "@/components/dashboard/CantinePlusSection";
import { formatStudentKitchenName } from "@/lib/studentDisplayName";
import { cn } from "@/lib/utils";

function RgpdNotice() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1a2d4a]/40 bg-white px-3 py-2.5 shadow-sm sm:flex-nowrap sm:gap-3.5 sm:px-3.5">
      <CantinePlusBadge className="shrink-0" />
      <p className="flex min-w-0 flex-1 items-start gap-2 text-sm leading-relaxed text-[#0a1628]">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#0a1628]" aria-hidden />
        <span>
          <strong className="font-semibold">Donnée de santé</strong> — visible uniquement par le
          personnel connecté. Ne pas diffuser hors du service de restauration.
        </span>
      </p>
    </div>
  );
}

function StudentAllergenRowItem({
  student,
  hasMenu,
}: {
  student: StudentAllergenRow;
  hasMenu: boolean;
}) {
  const concerned = hasMenu && student.affectedByMenu;

  return (
    <li
      className={cn(
        "rounded-xl border bg-white px-3.5 py-3.5 text-base shadow-sm",
        concerned ? "border-[#1a2d4a] ring-1 ring-[#1a2d4a]/25" : "border-zinc-200",
      )}
    >
      <div className="font-semibold text-zinc-900">
        {formatStudentKitchenName(student.firstName, student.lastName)}
        {concerned ? (
          <span className="ml-2 rounded-full bg-[#0a1628] px-2 py-0.5 text-sm font-bold text-white">
            Menu
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 text-sm font-medium text-zinc-700">
        {student.allergens.join(" · ")}
      </div>
      {hasMenu && student.affectedDishes.length > 0 ? (
        <div className="mt-1.5 text-sm text-[#0a1628]">
          <span className="font-semibold">Plats :</span> {student.affectedDishes.join(", ")}
        </div>
      ) : null}
    </li>
  );
}

export function ClassAllergenList({
  students,
  hasMenu,
}: {
  students: StudentAllergenRow[];
  hasMenu: boolean;
}) {
  const withAllergens = students.filter((s) => s.allergens.length > 0);
  if (withAllergens.length === 0) {
    return (
      <p className="text-sm text-zinc-600">Aucun élève avec allergène déclaré dans cette classe.</p>
    );
  }

  const concerned = withAllergens.filter((s) => s.affectedByMenu);
  const others = withAllergens.filter((s) => !s.affectedByMenu);

  return (
    <div className="space-y-4 rounded-2xl border-2 border-yellow-400 bg-[#e8eef5] p-4 shadow-sm sm:p-5">
      <RgpdNotice />
      <div className="text-base font-semibold text-[#0a1628]">
        Élèves concernés par le menu ({withAllergens.length})
        {hasMenu ? (
          <span className="font-normal text-[#1a2d4a]">
            {" "}
            — {concerned.length} concerné{concerned.length > 1 ? "s" : ""} par le menu du jour
          </span>
        ) : null}
      </div>

      {hasMenu && concerned.length > 0 ? (
        <div>
          <p className="mb-2.5 text-sm font-bold uppercase tracking-wide text-[#0a1628]">
            Concernés par le menu
          </p>
          <ul className="space-y-2.5">
            {concerned.map((s) => (
              <StudentAllergenRowItem key={s.id} student={s} hasMenu={hasMenu} />
            ))}
          </ul>
        </div>
      ) : null}

      {others.length > 0 ? (
        <div>
          <p className="mb-2.5 text-sm font-semibold text-zinc-700">
            Autres élèves avec allergènes déclarés
            {hasMenu ? " (non concernés par le menu du jour)" : ""}
          </p>
          <ul className="space-y-2.5">
            {others.map((s) => (
              <StudentAllergenRowItem key={s.id} student={s} hasMenu={hasMenu} />
            ))}
          </ul>
        </div>
      ) : null}

      {hasMenu && concerned.length === 0 ? (
        <p className="text-base text-[#0a1628]">
          Aucun élève de cette classe n’est concerné par le menu du jour.
        </p>
      ) : null}
    </div>
  );
}
