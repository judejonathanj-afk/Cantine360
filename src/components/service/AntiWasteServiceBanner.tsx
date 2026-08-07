import { Recycle, Baby, GraduationCap, Lightbulb } from "lucide-react";
import type { AntiWasteKitchenAdvice } from "@/lib/antiWasteKitchenAdvice";
import { cn } from "@/lib/utils";

export function AntiWasteServiceBanner({
  advice,
}: {
  advice: AntiWasteKitchenAdvice;
}) {
  const tipClass =
    advice.tipTone === "watch"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : advice.tipTone === "ok"
        ? "border-emerald-300 bg-emerald-50 text-emerald-950"
        : "border-sky-200 bg-sky-50 text-sky-950";

  return (
    <section
      aria-label="Aide Antigaspillage pour le service"
      className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100 px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
          <Recycle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-emerald-950 sm:text-base">
            Portions du jour — mode Antigaspillage
          </p>
          <p className="text-xs text-emerald-900/70 sm:text-sm">
            Repères mat. / prim. pour adapter le service aux enfants
            {advice.totalPlannedKgLabel
              ? ` · ~${advice.totalPlannedKgLabel} au total`
              : null}
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {advice.portions.map((p) => {
          const Icon = p.level === "MATERNELLE" ? Baby : GraduationCap;
          return (
            <div
              key={p.level}
              className="rounded-xl border border-emerald-100 bg-white/80 px-3.5 py-3"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-4 w-4 text-emerald-700"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-emerald-950">
                  {p.levelLabel}
                </p>
              </div>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900">
                {p.headcount > 0 ? p.headcount : "—"}
                <span className="ml-1.5 text-sm font-medium text-zinc-500">
                  {p.headcount > 0 ? p.basisLabel : "à saisir"}
                </span>
              </p>
              {p.gramsPerPlate != null ? (
                <p className="mt-1 text-sm text-zinc-700">
                  Viser ~{" "}
                  <strong className="font-semibold tabular-nums">
                    {p.gramsPerPlate} g
                  </strong>{" "}
                  / assiette
                  {p.plannedKgLabel ? (
                    <>
                      {" "}
                      · ~{p.plannedKgLabel}
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">
                  Renseignez le grammage du menu pour une cible en grammes.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          "mx-4 mb-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed sm:mx-5 sm:mb-5",
          tipClass,
        )}
        role="status"
      >
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">Conseil : </span>
          {advice.tip}
        </p>
      </div>
    </section>
  );
}
