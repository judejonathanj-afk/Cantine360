"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { cantinePlusShellClass } from "@/lib/cantinePlusTheme";
import { cn } from "@/lib/utils";

/** Barre de rangement admin, inspirée d’« Ouvrir les classes ». */
export function CantinePlusFold({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] bg-[#0d3b2e] shadow-[0_12px_32px_rgba(13,59,46,0.28)] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/5 sm:px-5 sm:py-4"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DFF59A] text-[#0d3b2e] sm:h-11 sm:w-11"
            aria-hidden
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              Cantine+
            </span>
            <span className="block text-base font-extrabold tracking-tight text-white sm:text-lg">
              {open ? "Masquer Cantine+" : "Ouvrir Cantine+"}
            </span>
            <span className="mt-0.5 block text-sm leading-snug text-white/80">
              Note, RAB et déchets — lecture globale en graphique et en chiffres.
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-white/70 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </section>
      {open ? children : null}
    </div>
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
