"use client";

type SchoolFilterCard = { schoolName: string };

export function ServiceSchoolFilter({
  cards,
  value,
  onChange,
}: {
  cards: SchoolFilterCard[];
  value: string;
  onChange: (school: string) => void;
}) {
  const schools = [...new Set(cards.map((c) => c.schoolName))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  if (schools.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-zinc-700">École :</span>
      <button
        type="button"
        onClick={() => onChange("all")}
        className={[
          "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
          value === "all"
            ? "bg-zinc-900 text-white"
            : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
        ].join(" ")}
      >
        Toutes ({cards.length})
      </button>
      {schools.map((school) => {
        const count = cards.filter((c) => c.schoolName === school).length;
        const active = value === school;
        return (
          <button
            key={school}
            type="button"
            onClick={() => onChange(school)}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
            ].join(" ")}
          >
            {school} ({count})
          </button>
        );
      })}
    </div>
  );
}
