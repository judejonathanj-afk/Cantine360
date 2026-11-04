"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { cantinePlusShellClass } from "@/lib/cantinePlusTheme";
import { cn } from "@/lib/utils";

const CANTINE_PLUS_OPEN_KEY = "cantine360-cantine-plus-open";

/** Cantine+ s’ouvre dans la page (pas de fenêtre ni de barre interne). */
export function CantinePlusFold({
  children,
  subtitle,
  headerAction,
}: {
  children: ReactNode;
  subtitle?: string;
  headerAction?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CANTINE_PLUS_OPEN_KEY) === "1") {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function setFoldOpen(next: boolean) {
    setOpen(next);
    try {
      if (next) sessionStorage.setItem(CANTINE_PLUS_OPEN_KEY, "1");
      else sessionStorage.removeItem(CANTINE_PLUS_OPEN_KEY);
    } catch {
      /* ignore */
    }
    if (next) {
      window.requestAnimationFrame(() => {
        document.getElementById("cantine-plus")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  if (!open) {
    return (
      <section
        id="cantine-plus"
        className="overflow-hidden rounded-[28px] bg-[#5b21b6] shadow-[0_12px_32px_rgba(91,33,182,0.38)] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <button
          type="button"
          onClick={() => setFoldOpen(true)}
          aria-expanded={false}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/5 sm:px-5 sm:py-4"
        >
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] sm:size-[3.75rem]"
            aria-hidden
          >
            <span className="flex size-11 items-center justify-center rounded-[14px] bg-violet-200 text-[#5b21b6] sm:size-12 sm:rounded-2xl">
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
              Note, RAB et déchets — lecture globale en graphique et en chiffres.
            </span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-white/70" aria-hidden />
        </button>
      </section>
    );
  }

  return (
    <section
      id="cantine-plus"
      className="space-y-4"
      aria-labelledby="cantine-plus-inline-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
            Cantine+
          </p>
          <h2
            id="cantine-plus-inline-title"
            className="mt-1 flex items-center gap-2 text-xl font-extrabold tracking-tight text-zinc-950 sm:text-2xl"
          >
            <Sparkles className="h-6 w-6 shrink-0 text-[#5b21b6]" strokeWidth={2.25} aria-hidden />
            Lecture globale graphique / chiffres
          </h2>
          {subtitle ? (
            <p className="mt-1 max-w-3xl text-sm font-medium leading-snug text-zinc-600 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setFoldOpen(false)}
          className="self-start rounded-full bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-800 transition hover:bg-zinc-200"
        >
          Replier
        </button>
      </div>
      {headerAction ? (
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {headerAction}
        </div>
      ) : null}
      {children}
    </section>
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
