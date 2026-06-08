"use client";

import { ChevronDown, Info } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function ServiceWorkflowHint() {
  return (
    <Collapsible className="group rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-zinc-50/80 rounded-2xl [&[data-state=open]]:rounded-b-none [&[data-state=open]]:border-b [&[data-state=open]]:border-zinc-100">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-900">
            Aide — flux de saisie en cuisine
          </span>
          <span className="mt-0.5 block text-xs text-zinc-500">
            Ordre conseillé pour les nouveaux : ouvrir pour voir les étapes.
          </span>
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-zinc-100 px-4 pb-4 pt-3">
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-700">
          <li>
            <strong className="font-semibold text-zinc-900">Ce jour, ce déjeuner.</strong> Les chiffres
            ci-dessous concernent uniquement la date affichée en titre. Pour un autre jour, retournez
            à « Service » pour ouvrir le bon créneau.
          </li>
          <li>
            <strong className="font-semibold text-zinc-900">Menu et allergènes</strong> — à jour si
            possible <strong className="font-semibold text-zinc-900">avant</strong> le service (bouton en
            haut à droite).
          </li>
          <li>
            <strong className="font-semibold text-zinc-900">Présents</strong> — souvent en premier :
            saisie dans chaque groupe au début du service.
          </li>
          <li>
            <strong className="font-semibold text-zinc-900">Servis, refus, restes</strong> — en général{" "}
            <strong className="font-semibold text-zinc-900">après</strong> le repas, quand vous avez les
            chiffres réels (touchez chaque groupe pour modifier).
          </li>
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
