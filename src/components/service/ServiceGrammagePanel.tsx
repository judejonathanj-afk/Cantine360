import { Scale } from "lucide-react";
import {
  computeServiceGrammageSummary,
  formatKgFromGrams,
  type MenuItemGrammage,
  type ServiceMetricsGrammage,
} from "@/lib/serviceGrammage";
import { cn } from "@/lib/utils";

export function ServiceGrammagePanel({
  menuItems,
  metrics,
  className,
}: {
  menuItems: MenuItemGrammage[];
  metrics: ServiceMetricsGrammage[];
  className?: string;
}) {
  const summary = computeServiceGrammageSummary(menuItems, metrics);

  return (
    <aside
      className={cn(
        "w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 text-white shadow-md sm:max-w-xs",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-yellow-300">
          <Scale className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-yellow-300">Grammage du service</p>
          {!summary.hasGrammage ? (
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Non renseigné — ajoutez les grammes dans Menu &amp; allergènes.
            </p>
          ) : (
            <>
              <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight">
                {summary.perPlate}{" "}
                <span className="text-sm font-semibold text-white/75">g / assiette</span>
              </p>
              {summary.basisCount > 0 ? (
                <p className="mt-1 text-xs text-white/70">
                  {formatKgFromGrams(summary.plannedGrams)} prévus · {summary.basisCount}{" "}
                  {summary.basisLabel}
                </p>
              ) : null}
              <ul className="mt-2 space-y-0.5 text-xs text-white/80">
                {summary.itemsWithGrammage.map((i) => (
                  <li key={`${i.category}-${i.label}`}>
                    {i.label} — {i.grammageG} g
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
