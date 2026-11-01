"use client";

import { Check, ChefHat, Scale } from "lucide-react";
import { formatKgFromGrams } from "@/lib/serviceGrammage";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("fr-FR");

function wasteDetail(wasteG: number, served: number) {
  const grams = Math.max(0, Math.round(wasteG));
  const per100 = served > 0 && grams > 0 ? (grams / served) * 100 : null;
  return {
    gramsLabel: `${nf.format(grams)} g`,
    kgLabel: formatKgFromGrams(grams),
    per100Label:
      per100 == null
        ? "— g / 100 assiettes"
        : `${nf.format(Math.round(per100))} g / 100 assiettes`,
  };
}

const LEVEL = {
  Maternelle: {
    card: "bg-emerald-50 ring-1 ring-emerald-100",
    kicker: "text-emerald-700",
    value: "text-emerald-950",
    muted: "text-emerald-800/70",
    row: "text-emerald-900",
    detail: "text-emerald-800",
  },
  Primaire: {
    card: "bg-sky-50 ring-1 ring-sky-100",
    kicker: "text-sky-700",
    value: "text-sky-950",
    muted: "text-sky-800/70",
    row: "text-sky-900",
    detail: "text-sky-800",
  },
} as const;

export function ServiceEndFicheCard({
  servedMaternelle,
  servedPrimaire,
  wasteMaternelleG,
  wastePrimaireG,
  onConfirm,
  confirming = false,
  className,
}: {
  servedMaternelle: number;
  servedPrimaire: number;
  wasteMaternelleG: number;
  wastePrimaireG: number;
  onConfirm: () => void;
  confirming?: boolean;
  className?: string;
}) {
  const rows = [
    {
      label: "Maternelle" as const,
      served: servedMaternelle,
      wasteG: wasteMaternelleG,
    },
    {
      label: "Primaire" as const,
      served: servedPrimaire,
      wasteG: wastePrimaireG,
    },
  ];

  return (
    <div
      className={cn(
        "w-full max-w-xl rounded-[28px] border border-[#ece7d8] bg-white p-5 shadow-[0_18px_50px_rgba(25,54,45,0.12)] sm:p-7",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-zinc-950 sm:text-xl">
          <ChefHat className="h-6 w-6 text-emerald-700" strokeWidth={2} aria-hidden />
          Fiche service
        </h2>
        <span className="rounded-full bg-[#fff4d7] px-3 py-1 text-[11px] font-semibold text-[#8b6b20]">
          Fin de service
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {rows.map(({ label, served }) => {
          const tone = LEVEL[label];
          return (
            <div key={label} className={cn("rounded-2xl px-4 py-4", tone.card)}>
              <p className={cn("text-sm font-bold", tone.kicker)}>{label}</p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "text-[2rem] font-extrabold leading-none tracking-tight",
                    tone.value,
                  )}
                >
                  {served}
                </span>
                <span className={cn("text-xs font-semibold", tone.muted)}>
                  repas servis
                </span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-2 text-[15px] font-bold text-zinc-950">
        <Scale className="h-5 w-5 text-emerald-700" aria-hidden />
        Pesée des déchets
      </div>

      <div className="mt-2 space-y-2.5">
        {rows.map(({ label, served, wasteG }) => {
          const tone = LEVEL[label];
          const detail = wasteDetail(wasteG, served);
          return (
            <div
              key={label}
              className={cn("rounded-2xl px-4 py-3.5", tone.card)}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={cn("text-[15px] font-extrabold", tone.row)}>{label}</p>
                <p className={cn("text-[15px] font-extrabold", tone.value)}>
                  {detail.gramsLabel}
                  <span className={cn("ml-1.5 text-sm font-semibold", tone.muted)}>
                    ({detail.kgLabel})
                  </span>
                </p>
              </div>
              <p className={cn("mt-1.5 text-[13px] font-semibold", tone.detail)}>
                {detail.per100Label}
              </p>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#2f7a4a] px-4 py-3.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#276640] disabled:opacity-80"
      >
        <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        {confirming
          ? "Clôture…"
          : "Service clôturé et pesées enregistrées"}
      </button>
    </div>
  );
}
