"use client";

import { Card, CardContent } from "@/components/ui/card";

type TopRow = { group: string; leftovers: number };

const ROW_BACKGROUNDS = ["bg-violet-100", "bg-amber-50", "bg-sky-100"] as const;

function splitGroupLabel(group: string): { school: string; className: string } {
  const sep = group.includes(" — ") ? " — " : " - ";
  const idx = group.indexOf(sep);
  if (idx === -1) return { school: group, className: "" };
  return {
    school: group.slice(0, idx),
    className: group.slice(idx + sep.length),
  };
}

export function LeftoversByGroupTop({ top }: { top: TopRow[] }) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Restes par groupe (top)</h2>
        {top.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Pas de données.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {top.map((g, index) => {
              const { school, className } = splitGroupLabel(g.group);
              const bg = ROW_BACKGROUNDS[index % ROW_BACKGROUNDS.length];

              return (
                <li
                  key={g.group}
                  className={[
                    "flex overflow-hidden rounded-2xl border border-black/5 shadow-sm",
                    bg,
                  ].join(" ")}
                >
                  <div className="flex w-[7.5rem] shrink-0 flex-col items-center justify-center border-r border-black/10 px-3 py-4 sm:w-32">
                    <span className="text-2xl font-bold tabular-nums leading-none text-zinc-800">
                      {g.leftovers.toLocaleString("fr-FR")}
                    </span>
                    <span className="mt-1 text-xs font-medium text-zinc-600">restes</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3 sm:px-5 sm:py-4">
                    <p className="truncate text-sm text-zinc-500">{school}</p>
                    <p className="truncate text-base font-bold text-zinc-900 sm:text-lg">
                      {className || g.group}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
