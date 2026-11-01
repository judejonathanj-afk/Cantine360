"use client";

import { Check, ChefHat, Scale } from "lucide-react";
import { formatKgFromGrams } from "@/lib/serviceGrammage";
import { cn } from "@/lib/utils";

function gPer100Label(wasteG: number, served: number): string {
  if (wasteG <= 0 || served <= 0) return "—";
  const value = Math.round((wasteG / served) * 100);
  return `${new Intl.NumberFormat("fr-FR").format(value)} g / 100 assiettes`;
}

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
        {(
          [
            ["Maternelle", servedMaternelle],
            ["Primaire", servedPrimaire],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-[#f4faf6] px-4 py-4">
            <p className="text-sm font-medium text-zinc-500">{label}</p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[2rem] font-extrabold leading-none tracking-tight text-zinc-950">
                {value}
              </span>
              <span className="text-xs font-medium text-zinc-500">repas servis</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 text-[15px] font-bold text-zinc-950">
        <Scale className="h-5 w-5 text-emerald-700" aria-hidden />
        Pesée des déchets
      </div>

      <div className="mt-2 divide-y divide-zinc-200 border-t border-zinc-200">
        {(
          [
            ["Maternelle", wasteMaternelleG, servedMaternelle],
            ["Primaire", wastePrimaireG, servedPrimaire],
          ] as const
        ).map(([label, grams, served]) => (
          <div key={label} className="flex items-start justify-between gap-3 py-3.5">
            <p className="text-[15px] font-semibold text-zinc-950">{label}</p>
            <div className="text-right">
              <p className="text-[15px] font-extrabold text-zinc-950">
                {formatKgFromGrams(grams)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {gPer100Label(grams, served)}
              </p>
            </div>
          </div>
        ))}
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
