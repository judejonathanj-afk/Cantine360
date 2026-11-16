"use client";

import { useState } from "react";
import { CircleHelp, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const GUIDE_ITEMS = [
  {
    title: "Graphique du haut",
    text: "Barres = assiettes servies · ligne = déchets (g) · pointillés = g de déchets pour 100 assiettes.",
  },
  {
    title: "Cantine+",
    text: "Lecture globale : score, RAB et déchets, pour voir d’un coup si le service tient.",
  },
  {
    title: "Écoles et classes",
    text: "Liste des écoles, des classes et des objectifs — à ajuster classe par classe si besoin.",
  },
  {
    title: "Flux du repas",
    text: "Présents → servis → RAB / refus, jour par jour, pour voir où le repas se perd.",
  },
  {
    title: "Taux du cycle",
    text: "Service, RAB et refus comparés par cycle, pour ajuster portions et menu.",
  },
  {
    title: "Évolution des déchets",
    text: "Pesées dans le temps, maternelle et primaire, pour repérer les jours qui montent.",
  },
  {
    title: "Contexte du service",
    text: "Un jour en détail : menu, écoles, pesée et écarts par rapport à la veille.",
  },
  {
    title: "Suivi jour par jour",
    text: "Le tableau des compteurs — présents, servis, RAB, refus, déchets — à relire ou télécharger.",
  },
];

export function DashboardExploreIntro({
  hideCantinePlus = false,
}: {
  hideCantinePlus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const items = hideCantinePlus
    ? GUIDE_ITEMS.filter((item) => item.title !== "Cantine+")
    : GUIDE_ITEMS;

  return (
    <div className="flex flex-col items-start gap-4 px-1 sm:px-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Explorez vos données
        </p>
        <h2 className="mt-1.5 font-display text-[1.65rem] font-extrabold leading-tight tracking-tight text-[#16382c] sm:text-3xl">
          Tout comprendre, simplement.
        </h2>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#5f746c] shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-[#16382c]"
      >
        <span
          className="flex size-6 items-center justify-center rounded-full border border-[#8aa198] text-[#5f746c]"
          aria-hidden
        >
          <CircleHelp className="size-3.5" strokeWidth={2.4} />
        </span>
        Guide de lecture
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="z-[100]"
          className="z-[100] max-w-lg gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-[0_24px_60px_-24px_rgba(15,60,40,0.45)]"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-30 flex size-8 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-zinc-800"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
          <div className="px-5 pb-5 pt-6 sm:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Explorez vos données
            </p>
            <DialogTitle className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-[#16382c]">
              Guide de lecture
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm font-medium text-zinc-600">
              Comment lire le graphique et les boules en dessous.
            </DialogDescription>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl bg-[#f4f7f4] px-4 py-3"
                >
                  <p className="text-sm font-extrabold text-[#16382c]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-snug text-zinc-700">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
