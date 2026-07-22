import type { StudentAllergenRow } from "@/server/serviceAllergenSummary";
import { ShieldAlert } from "lucide-react";
import { CantinePlusBadge } from "@/components/dashboard/CantinePlusSection";
import { formatStudentKitchenName } from "@/lib/studentDisplayName";

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

function StudentAllergenRowItem({ student }: { student: StudentAllergenRow }) {
  return (
    <li className="rounded-xl border border-[#1a2d4a] bg-white px-3.5 py-3.5 text-base shadow-sm ring-1 ring-[#1a2d4a]/25">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-sm font-bold text-white sm:text-base">
          {formatStudentKitchenName(student.firstName, student.lastName)}
        </span>
        <span className="rounded-full bg-[#0a1628] px-2 py-0.5 text-sm font-bold text-white">
          Menu
        </span>
      </div>
      <div className="mt-1.5 text-sm font-medium text-zinc-700">
        {student.allergens.join(" · ")}
      </div>
      {student.affectedDishes.length > 0 ? (
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
  const concerned = students.filter(
    (s) => s.allergens.length > 0 && s.affectedByMenu,
  );

  return (
    <div className="space-y-4 rounded-2xl border-2 border-yellow-400 bg-[#e8eef5] p-4 shadow-sm sm:p-5">
      <RgpdNotice />
      <div className="text-base font-semibold text-[#0a1628]">
        Élèves concernés par le menu ({concerned.length})
      </div>

      {!hasMenu ? (
        <p className="text-base text-[#0a1628]">
          Renseignez le menu du jour pour voir les élèves concernés.
        </p>
      ) : concerned.length === 0 ? (
        <p className="text-base text-[#0a1628]">
          Aucun élève de cette classe n’est concerné par le menu du jour.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {concerned.map((s) => (
            <StudentAllergenRowItem key={s.id} student={s} />
          ))}
        </ul>
      )}
    </div>
  );
}
