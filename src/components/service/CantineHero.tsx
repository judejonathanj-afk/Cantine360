"use client";

import Image from "next/image";
import { Sparkles, UtensilsCrossed } from "lucide-react";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";

export function CantineHero() {
  return (
    <section className="relative min-h-[220px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:min-h-[260px]">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-16 top-1/2 h-[260px] w-[260px] -translate-y-1/2 rounded-full bg-zinc-900 opacity-95" />
        <div className="absolute -right-20 -top-20 h-[200px] w-[200px] rounded-full bg-zinc-900 opacity-90" />
        <div className="absolute bottom-4 right-1/4 h-16 w-16 rounded-full bg-zinc-100 blur-xl" />
        <div className="absolute left-1/3 top-4 h-12 w-12 rounded-full bg-zinc-50 blur-lg" />
      </div>

      <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 md:left-8">
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-zinc-200 shadow-xl md:h-36 md:w-36 md:border-[3px]">
            <Image
              src="/images/cantine-scolaire.jpg"
              alt="Cantine scolaire moderne"
              width={144}
              height={144}
              className="h-full w-full scale-110 object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-1 -right-1 animate-bounce rounded-full bg-white p-1.5 shadow-lg md:bottom-1 md:-right-1 md:p-2">
            <div className="flex items-center gap-1 px-1">
              <Sparkles className="h-3 w-3 text-amber-500 md:h-3.5 md:w-3.5" />
              <span className="whitespace-nowrap text-[10px] font-bold text-zinc-900 md:text-xs">
                Anti-gaspi
              </span>
            </div>
          </div>
          <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/80 backdrop-blur-sm md:h-10 md:w-10">
            <UtensilsCrossed className="h-4 w-4 text-white md:h-5 md:w-5" />
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 z-20 w-[calc(100%-7rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 px-2 text-center md:w-[calc(100%-12rem)]">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1">
          <Sparkles className="h-3 w-3 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-600">
            Réduisons le gaspillage ensemble
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <div className="inline-flex shrink-0 rounded-xl bg-zinc-900 px-4 py-2 shadow-lg md:rounded-2xl md:px-5 md:py-2.5">
            <MenusCantineColorTitle
              text="SERVICE CANTINE"
              className="whitespace-nowrap text-2xl md:text-3xl lg:text-4xl"
            />
          </div>
          <p className="max-w-2xl text-sm leading-snug text-zinc-900 md:text-base lg:text-lg">
            Pour ouvrir un service : choisissez la{" "}
            <strong className="font-semibold text-zinc-900">date</strong> du{" "}
            <strong className="font-semibold text-zinc-900">déjeuner</strong>, puis « Démarrer le
            service » pour saisir les groupes.
          </p>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 -skew-x-12 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent"
        aria-hidden
      />
    </section>
  );
}
