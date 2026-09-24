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

function kitchenAllergenDetail(notes: string | null | undefined): string {
  const trimmed = notes?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "à ne pas servir — allergie";
}

function StudentAllergenRowItem({ student }: { student: StudentAllergenRow }) {
  const detail = kitchenAllergenDetail(student.allergenNotes);

  return (
    <li className="rounded-xl border border-[#1a2d4a] bg-white px-3.5 py-3.5 text-base shadow-sm ring-1 ring-[#1a2d4a]/25">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-sm font-bold text-white sm:text-base">
          {formatStudentKitchenName(student.firstName, student.lastName)}
        </span>
        {student.noPork ? (
          <span className="rounded-full border-2 border-zinc-900 bg-sky-800 px-2 py-0.5 text-sm font-bold text-white">
            Sans porc
          </span>
        ) : null}
        {student.vegetarian ? (
          <span className="rounded-full border-2 border-zinc-900 bg-emerald-800 px-2 py-0.5 text-sm font-bold text-white">
            Végétarien
          </span>
        ) : null}
      </div>
      <ul className="mt-2 space-y-1.5">
        {student.allergens.map((allergen) => (
          <li key={allergen} className="text-base leading-snug text-zinc-800 sm:text-lg">
            <strong className="font-bold text-zinc-950">Allergène</strong>
            {" : "}
            <strong className="text-lg font-bold text-zinc-950 sm:text-xl">{allergen}</strong>
            {" "}
            <span className="text-zinc-700">
              (
              {detail.startsWith("à ne pas servir") ? (
                <>
                  <strong className="font-bold text-zinc-950">à ne pas servir</strong>
                  {detail.slice("à ne pas servir".length)}
                </>
              ) : (
                detail
              )}
              )
            </span>
          </li>
        ))}
      </ul>
      {student.affectedDishes.length > 0 ? (
        <div className="mt-2 text-sm text-[#0a1628]">
          <span className="font-semibold">Plats :</span> {student.affectedDishes.join(", ")}
        </div>
      ) : null}
    </li>
  );
}

function StudentDietRowItem({ student }: { student: StudentAllergenRow }) {
  return (
    <li className="rounded-xl border border-sky-700 bg-white px-3.5 py-3.5 text-base shadow-sm ring-1 ring-sky-700/20">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-sm font-bold text-white sm:text-base">
          {formatStudentKitchenName(student.firstName, student.lastName)}
        </span>
        {student.noPork ? (
          <span className="rounded-full bg-sky-800 px-2 py-0.5 text-sm font-bold text-white">
            Sans porc
          </span>
        ) : null}
        {student.vegetarian ? (
          <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-sm font-bold text-white">
            Végétarien
          </span>
        ) : null}
      </div>
      {student.dietDishes.length > 0 ? (
        <div className="mt-2 text-sm text-[#0a1628]">
          <span className="font-semibold">Plats :</span> {student.dietDishes.join(", ")}
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
  const dietConcerned = students.filter((s) => s.dietAffectedByMenu);

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

      {hasMenu ? (
        <div className="space-y-2 border-t border-[#1a2d4a]/15 pt-4">
          <div className="text-base font-semibold text-sky-950">
            Régimes à adapter ({dietConcerned.length})
          </div>
          {dietConcerned.length === 0 ? (
            <p className="text-base text-[#0a1628]">
              Aucun régime sans porc / végétarien en conflit avec le menu.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {dietConcerned.map((s) => (
                <StudentDietRowItem key={`diet-${s.id}`} student={s} />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
