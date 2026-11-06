"use client";

import type {
  GroupAllergenSummary,
  ServiceAllergenSummary,
} from "@/server/serviceAllergenSummary";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { formatStudentKitchenName } from "@/lib/studentDisplayName";
import { cn } from "@/lib/utils";
import { DIET_KEYS, DIET_META, studentHasAnyDiet } from "@/lib/dietaryRegime";

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

const ALLERGEN_LIST_MAX_PX = 320;

function AllergenDetailList({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setOverflows(el.scrollHeight > ALLERGEN_LIST_MAX_PX);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  return (
    <ul
      ref={ref}
      className={cn(
        "mt-3 space-y-2.5",
        overflows
          ? "max-h-[20rem] overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-200"
          : "overflow-visible",
      )}
    >
      {children}
    </ul>
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

  const { students } = groupSummary;

  const detailRows = students.filter(
    (student) =>
      student.allergens.length > 0 ||
      studentHasAnyDiet(student) ||
      student.affectedByMenu ||
      student.dietAffectedByMenu,
  );

  if (detailRows.length === 0) {
    return null;
  }

  const allergyCount = detailRows.filter((student) => student.allergens.length > 0).length;
  const menuCount = detailRows.filter(
    (student) =>
      student.affectedByMenu ||
      student.dietAffectedByMenu ||
      student.affectedDishes.length > 0 ||
      student.dietDishes.length > 0,
  ).length;
  const dietCounts = Object.fromEntries(
    DIET_KEYS.map((key) => [
      key,
      detailRows.filter((student) => student[key]).length,
    ]),
  ) as Record<(typeof DIET_KEYS)[number], number>;

  const summaryParts: ReactNode[] = [
    `${detailRows.length} élève${detailRows.length > 1 ? "s" : ""} concerné${detailRows.length > 1 ? "s" : ""}`,
  ];
  if (allergyCount > 0) {
    summaryParts.push(`${allergyCount} allergie${allergyCount > 1 ? "s" : ""}`);
  }
  if (hasMenu && menuCount > 0) {
    summaryParts.push(
      `${menuCount} concerné${menuCount > 1 ? "s" : ""} par le menu`,
    );
  }
  for (const key of DIET_KEYS) {
    if (dietCounts[key] > 0) {
      summaryParts.push(
        `${dietCounts[key]} ${dietCounts[key] > 1 ? DIET_META[key].labelPlural : DIET_META[key].label.toLowerCase()}`,
      );
    }
  }

  return (
    <div className="mt-2">
      <p className="mb-2 flex items-center gap-2 text-left text-lg font-extrabold text-zinc-950 sm:text-xl">
        <AlertTriangle className="h-6 w-6 shrink-0 text-amber-700" aria-hidden />
        Allergies et régimes
      </p>
      <div className="rounded-2xl border-2 border-[#C8E86A] bg-white px-4 py-4 shadow-sm ring-1 ring-[#C8E86A]/40">
      <p className="text-lg font-bold leading-snug text-zinc-950">
        {summaryParts.map((part, index) => (
          <span key={index}>
            {index > 0 ? " · " : null}
            {part}
          </span>
        ))}
      </p>
      {detailRows.length > 0 ? (
        <AllergenDetailList>
          {detailRows.map((student) => {
            const lines: { key: string; content: ReactNode }[] = [];
            if (student.allergens.length > 0) {
              const note = student.allergenNotes?.trim();
              lines.push({
                key: "allergens",
                content: note
                  ? `${student.allergens.join(", ")} — ${note}.`
                  : `à ne pas servir : ${student.allergens.join(", ")}.`,
              });
            }
            for (const key of DIET_KEYS) {
              if (!student[key]) continue;
              lines.push({
                key,
                content: `${DIET_META[key].label} — ${DIET_META[key].kitchenHint}`,
              });
            }
            const dishes = [
              ...new Set([...student.affectedDishes, ...student.dietDishes]),
            ];
            if (dishes.length > 0) {
              lines.push({
                key: "dishes",
                content: `plats à ne pas servir / à adapter : ${dishes.join(", ")}.`,
              });
            }
            return (
              <li
                key={student.id}
                className="rounded-xl border-2 border-[#C8E86A] bg-[#DFF59A] px-3 py-2.5 text-lg leading-snug text-zinc-800"
              >
                <p>
                  <span className="mr-1.5 inline-flex rounded-full bg-black px-3 py-1 text-lg font-extrabold text-white">
                    {formatStudentKitchenName(student.firstName, student.lastName)}
                  </span>
                  {lines[0] ? (
                    <span className="font-bold text-zinc-950">{lines[0].content}</span>
                  ) : null}
                </p>
                {lines.slice(1).map((line) => (
                  <p key={line.key} className="mt-0.5 font-bold text-zinc-950">
                    {line.content}
                  </p>
                ))}
              </li>
            );
          })}
        </AllergenDetailList>
      ) : null}
      </div>
    </div>
  );
}
