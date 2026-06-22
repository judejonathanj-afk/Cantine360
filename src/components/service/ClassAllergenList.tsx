import type { StudentAllergenRow } from "@/server/serviceAllergenSummary";
import { ShieldAlert } from "lucide-react";
import { formatStudentKitchenName } from "@/lib/studentDisplayName";
import { cn } from "@/lib/utils";

function RgpdNotice() {
  return (
    <p className="flex items-start gap-2.5 rounded-xl border border-red-300/90 bg-white px-3.5 py-2.5 text-xs leading-relaxed text-red-950 shadow-sm">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
      <span>
        <strong className="font-semibold">Donnée de santé</strong> — visible uniquement par le
        personnel connecté. Ne pas diffuser hors du service de restauration.
      </span>
    </p>
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
        "rounded-xl border bg-white px-3.5 py-3 text-sm shadow-sm",
        concerned ? "border-red-400 ring-1 ring-red-200/80" : "border-zinc-200",
      )}
    >
      <div className="font-semibold text-zinc-900">
        {formatStudentKitchenName(student.firstName, student.lastName)}
        {concerned ? (
          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-900">
            Menu
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 text-xs font-medium text-zinc-700">
        {student.allergens.join(" · ")}
      </div>
      {hasMenu && student.affectedDishes.length > 0 ? (
        <div className="mt-1.5 text-xs text-red-900">
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
    <div className="space-y-4 rounded-2xl border-2 border-red-300 bg-red-50 p-4 shadow-sm sm:p-5">
      <RgpdNotice />
      <div className="text-sm font-semibold text-red-950">
        Élèves & allergènes ({withAllergens.length})
        {hasMenu ? (
          <span className="font-normal text-red-900">
            {" "}
            — {concerned.length} concerné{concerned.length > 1 ? "s" : ""} par le menu du jour
          </span>
        ) : null}
      </div>

      {hasMenu && concerned.length > 0 ? (
        <div>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-red-800">
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
          <p className="mb-2.5 text-xs font-semibold text-zinc-700">
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
        <p className="text-sm text-red-900">
          Aucun élève de cette classe n’est concerné par le menu du jour.
        </p>
      ) : null}
    </div>
  );
}
