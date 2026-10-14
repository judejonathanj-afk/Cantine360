import { AlertTriangle, Recycle, Baby, GraduationCap, Lightbulb } from "lucide-react";
import type { AntiWasteKitchenAdvice } from "@/lib/antiWasteKitchenAdvice";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { cn } from "@/lib/utils";

export function AntiWasteServiceBanner({
  advice,
  asConclusion = false,
  variant = "full",
  className,
}: {
  advice: AntiWasteKitchenAdvice;
  /** Affiché après enregistrement des déchets — conclusion de service. */
  asConclusion?: boolean;
  variant?: "full" | "compact";
  className?: string;
}) {
  const tipClass =
    advice.tipTone === "watch"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : advice.tipTone === "ok"
        ? "border-emerald-300 bg-emerald-50 text-emerald-950"
        : "border-sky-200 bg-sky-50 text-sky-950";

  const alert = advice.riskyDishAlert ?? null;

  if (variant === "compact") {
    const mat = advice.portions.find((p) => p.level === "MATERNELLE");
    const prim = advice.portions.find((p) => p.level === "PRIMAIRE");

    const shortServisLine = [mat, prim]
      .filter((p): p is NonNullable<typeof p> => p != null && p.headcount > 0)
      .map((p) => `${p.levelLabel} ${p.headcount} servis`)
      .join(" · ");

    const alertAction =
      alert && alert.tip.includes(" — ")
        ? alert.tip.slice(alert.tip.indexOf(" — ") + 3).trim()
        : null;

    const gramsMetric =
      mat?.gramsPerPlate != null || prim?.gramsPerPlate != null ? (
        <span className="text-base font-semibold">
          {mat?.gramsPerPlate != null ? `Mat. ~${mat.gramsPerPlate} g` : null}
          {mat?.gramsPerPlate != null && prim?.gramsPerPlate != null ? " · " : null}
          {prim?.gramsPerPlate != null ? `Prim. ~${prim.gramsPerPlate} g` : null}
        </span>
      ) : (
        "Portions du jour"
      );

    if (asConclusion) {
      const actionText =
        alertAction && alertAction.length > 0
          ? alertAction.charAt(0).toUpperCase() + alertAction.slice(1)
          : null;

      return (
        <div
          className={cn(
            "flex h-full min-h-0 flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm",
            className,
          )}
        >
          <div className="flex items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80">
              <Recycle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold leading-snug text-zinc-800">
                Service enregistré
              </h2>
              <p className="mt-0.5 text-xs leading-snug text-zinc-500">
                Antigaspillage — conclusion du service
              </p>
            </div>
          </div>

          {alert ? (
            <div
              className="mt-2.5 rounded-lg border border-rose-200/90 bg-rose-50 px-2.5 py-2 text-xs leading-relaxed text-rose-950"
              role="status"
            >
              <p className="font-semibold leading-snug">
                Plat à risque n°{alert.rank} : « {alert.label} »
              </p>
              {actionText ? (
                <p className="mt-1.5 text-rose-900/95">{actionText}</p>
              ) : null}
            </div>
          ) : (
            <div className="mt-2.5 space-y-1.5 text-xs leading-snug text-zinc-700">
              <div className="font-semibold text-zinc-900">{gramsMetric}</div>
              {shortServisLine ? <p>{shortServisLine}</p> : null}
            </div>
          )}
        </div>
      );
    }

    return (
      <ServiceInsightCard
        tone="soft"
        dense
        icon={Recycle}
        title="Antigaspillage"
        subtitle={
          advice.totalPlannedKgLabel
            ? `~${advice.totalPlannedKgLabel} au total`
            : "Repères mat. / prim."
        }
        metric={
          alert ? (
            <span className="text-sm font-semibold leading-snug text-rose-800">
              Plat à risque n°{alert.rank} : « {alert.label} »
            </span>
          ) : (
            gramsMetric
          )
        }
        className={cn("h-auto", className)}
      >
        {alert && alertAction ? (
          <p className="line-clamp-2">{alertAction}</p>
        ) : (
          <>
            {shortServisLine ? <p>{shortServisLine}</p> : null}
            {!alert && advice.tip ? (
              <p className={cn("line-clamp-2", shortServisLine && "mt-1")}>
                {advice.tip}
              </p>
            ) : null}
          </>
        )}
      </ServiceInsightCard>
    );
  }

  return (
    <section
      aria-label={
        asConclusion
          ? "Conclusion Antigaspillage — service enregistré"
          : "Aide Antigaspillage pour le service"
      }
      className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 shadow-sm"
    >
      {asConclusion ? (
        <div className="border-b border-emerald-200 bg-emerald-800 px-4 py-3 text-center text-sm font-semibold text-white sm:px-5 sm:text-base">
          Service enregistré — conclusion Antigaspillage
        </div>
      ) : null}

      {alert ? (
        <div
          className="border-b border-rose-300/60 bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-3.5 text-white sm:px-5"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/90">
                Alerte du jour — plat à risque n°{alert.rank}
              </p>
              <p className="mt-1 text-base font-bold leading-snug sm:text-lg">
                « {alert.label} » revient aujourd’hui
                <span className="font-semibold text-white/90">
                  {" "}
                  (~
                  {alert.avgWasteGPer100.toLocaleString("fr-FR", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  g / 100 en moyenne)
                </span>
              </p>
              <p className="mt-1.5 text-sm leading-snug text-white/95">
                {alert.tip}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100 px-4 py-3 sm:px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
          <Recycle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-emerald-950 sm:text-base">
            Portions du jour — mode Antigaspillage
          </p>
          <p className="text-xs text-emerald-900/70 sm:text-sm">
            {asConclusion
              ? "Repères mat. / prim. pour la prochaine fois"
              : "Repères mat. / prim. pour adapter le service aux enfants"}
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
