"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { cantinePlusShellClass } from "@/lib/cantinePlusTheme";
import { cn } from "@/lib/utils";

/** Carte pour ouvrir la lecture globale sur la même page Cantine+. */
export function CantinePlusFold({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      id="cantine-plus"
      onClick={onOpen}
      className="flex w-full items-center gap-3 overflow-hidden rounded-[28px] bg-[#0d3b2e] px-4 py-3.5 text-left shadow-[0_12px_32px_rgba(13,59,46,0.28)] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.02] hover:bg-[#0a2f24] motion-reduce:transition-none motion-reduce:hover:scale-100 sm:px-5 sm:py-4"
    >
      <span
        className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] sm:size-[3.75rem]"
        aria-hidden
      >
        <span className="flex size-11 items-center justify-center rounded-[14px] bg-[#d8f48a] text-[#0d3b2e] sm:size-12 sm:rounded-2xl">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
          Cantine+
        </span>
        <span className="block text-base font-extrabold tracking-tight text-white sm:text-lg">
          Ouvrir Cantine+
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-white/80">
          Lecture globale graphique / chiffres — dans cette page.
        </span>
      </span>
      <ChevronDown className="h-5 w-5 shrink-0 text-white/70" aria-hidden />
    </button>
  );
}

/** Enveloppe marketing : regroupe score + graphiques sous la marque Cantine +. */
export function CantinePlusSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("space-y-4", className)}
      aria-labelledby="cantine-plus-heading"
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border-2 px-4 py-5 text-center shadow-md sm:px-6 sm:py-6",
          cantinePlusShellClass,
        )}
      >
        <div className="flex justify-center">
          <div
            id="cantine-plus-heading"
            className="inline-flex w-full max-w-xl justify-center rounded-xl bg-[#06101c] px-6 py-2.5 shadow-lg ring-1 ring-white/10 sm:rounded-2xl sm:px-10 sm:py-3"
          >
            <MenusCantineColorTitle
              text="CANTINE +"
              className="text-2xl tracking-[0.12em] sm:text-3xl sm:tracking-[0.14em] lg:text-4xl"
            />
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-3xl text-pretty text-sm leading-relaxed text-white/80 sm:text-base">
          Module de pilotage avancé —{" "}
          <strong className="font-semibold text-white">score</strong>,{" "}
          <strong className="font-semibold text-white">flux du repas</strong>,{" "}
          <strong className="font-semibold text-white">maternelle / primaire</strong>{" "}
          et{" "}
          <strong className="font-semibold text-white">évolution des déchets</strong>
          . Les indicateurs qui font la différence en commission et en cuisine.
        </p>
        <p className="mx-auto mt-1.5 max-w-2xl text-xs text-white/55 sm:text-sm">
          Fonctions Cantine+ · inclus dans Cantine360
        </p>
      </div>

      <div className="space-y-8 sm:space-y-10">{children}</div>
    </section>
  );
}

/** Pastille sur chaque graphique — mêmes couleurs que le titre CANTINE +. */
export function CantinePlusBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#3d8582] bg-[#2f6b69] px-3 py-1 shadow-sm ring-1 ring-white/10",
        className,
      )}
    >
      <MenusCantineColorTitle
        text="CANTINE +"
        className="!text-[11px] !leading-none tracking-[0.14em] sm:!text-xs"
      />
    </span>
  );
}
