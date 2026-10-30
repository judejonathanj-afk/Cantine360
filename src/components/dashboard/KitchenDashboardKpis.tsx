"use client";

import { useState, type ReactNode } from "react";
import {
  Ban,
  Repeat2,
  Trash2,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

type Totals = {
  present: number;
  served: number;
  rab: number;
  refused: number;
};

type KpiId = "present" | "served" | "rab" | "refused" | "waste";

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function formatDayFr(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function peakDay(
  rows: DashboardDayDetailRow[],
  pick: (r: DashboardDayDetailRow) => number,
) {
  if (rows.length === 0) return null;
  return rows.reduce((best, r) => (pick(r) > pick(best) ? r : best));
}

function LevelFill({
  level,
  children,
}: {
  level: "MATERNELLE" | "PRIMAIRE";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-extrabold",
        level === "MATERNELLE"
          ? "bg-sky-400 text-sky-950"
          : "bg-emerald-400 text-emerald-950",
      )}
    >
      {children}
    </span>
  );
}

export function KitchenDashboardKpis({
  days,
  levelFilter,
  totals,
  servedVsPresentPct,
  rabRatePct,
  refusalRatePct,
  totalWasteWeightG,
  totalWasteMaternelleG,
  totalWastePrimaireG,
  wasteGramsPer100Served,
  servicesWithWaste,
  perDayRows,
}: {
  days: 7 | 30;
  levelFilter: "all" | SchoolLevel;
  totals: Totals;
  servedVsPresentPct: string;
  rabRatePct: string;
  refusalRatePct: string;
  totalWasteWeightG: number;
  totalWasteMaternelleG: number;
  totalWastePrimaireG: number;
  wasteGramsPer100Served: number | null;
  servicesWithWaste: number;
  perDayRows: DashboardDayDetailRow[];
}) {
  const [open, setOpen] = useState<KpiId | null>(null);
  const levelNote =
    levelFilter === "all"
      ? "Tous niveaux"
      : schoolLevelLabelFr(levelFilter);
  const daysServed = perDayRows.filter((r) => r.served > 0).length;
  const daysPresent = perDayRows.filter((r) => r.present > 0).length;
  const peakPresent = peakDay(perDayRows, (r) => r.present);
  const peakServed = peakDay(perDayRows, (r) => r.served);
  const peakRab = peakDay(perDayRows, (r) => r.rab);
  const peakRefused = peakDay(perDayRows, (r) => r.refused);
  const peakWaste = peakDay(perDayRows, (r) => r.wasteWeightG);
  const avgPresent = daysPresent > 0 ? totals.present / daysPresent : 0;
  const avgServed = daysServed > 0 ? totals.served / daysServed : 0;
  const leftover =
    totals.present > totals.served ? totals.present - totals.served : 0;

  const cards: {
    id: KpiId;
    icon: LucideIcon;
    label: string;
    value: string;
    sub: string;
    accent: string;
    iconWrap: string;
  }[] = [
    {
      id: "present",
      icon: Users,
      label: "Élèves présents",
      value: fmt(totals.present),
      sub: `${daysPresent} jour${daysPresent > 1 ? "s" : ""} de service`,
      accent: "border-zinc-900 bg-zinc-50",
      iconWrap: "bg-zinc-900 text-white",
    },
    {
      id: "served",
      icon: UtensilsCrossed,
      label: "Assiettes servies",
      value: fmt(totals.served),
      sub: `${servedVsPresentPct} des présents`,
      accent: "border-emerald-700 bg-emerald-50",
      iconWrap: "bg-emerald-700 text-white",
    },
    {
      id: "rab",
      icon: Repeat2,
      label: "RAB",
      value: fmt(totals.rab),
      sub: `${rabRatePct} des servis`,
      accent: "border-teal-700 bg-teal-50",
      iconWrap: "bg-teal-700 text-white",
    },
    {
      id: "refused",
      icon: Ban,
      label: "Refus",
      value: fmt(totals.refused),
      sub: `Taux ${refusalRatePct}`,
      accent: "border-rose-600 bg-rose-50",
      iconWrap: "bg-rose-600 text-white",
    },
    {
      id: "waste",
      icon: Trash2,
      label: "Déchets (poids)",
      value:
        totalWasteWeightG > 0 ? `${fmt(totalWasteWeightG)} g` : "—",
      sub:
        wasteGramsPer100Served != null
          ? `${wasteGramsPer100Served.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g / 100`
          : "Pesée en fin de service",
      accent: "border-amber-600 bg-amber-50",
      iconWrap: "bg-amber-600 text-white",
    },
  ];

  const details: Record<
    KpiId,
    { title: string; lead: ReactNode; lines: ReactNode[] }
  > = {
    present: {
      title: "Élèves présents",
      lead: (
        <>
          {fmt(totals.present)} présents sur {days} jours ·{" "}
          {levelFilter === "all" ? (
            levelNote
          ) : (
            <LevelFill level={levelFilter}>{levelNote}</LevelFill>
          )}
          .
        </>
      ),
      lines: [
        daysPresent > 0
          ? `Moyenne : ${fmt(avgPresent)} présents par jour de service (${daysPresent} jour${daysPresent > 1 ? "s" : ""}).`
          : "Aucun présent saisi sur la période.",
        peakPresent && peakPresent.present > 0
          ? `Jour le plus chargé : ${formatDayFr(peakPresent.date)} — ${fmt(peakPresent.present)} présents (${peakPresent.mealLabel}).`
          : "Pas encore de jour de pointe.",
        "Ce chiffre vient des compteurs cuisine par classe, le jour du service.",
      ],
    },
    served: {
      title: "Assiettes servies",
      lead: `${fmt(totals.served)} assiettes servies · ${servedVsPresentPct} des présents.`,
      lines: [
        leftover > 0
          ? `${fmt(leftover)} présents n’ont pas été comptés comme servis (écart présents / servis).`
          : "Les assiettes servies couvrent (ou dépassent) les présents saisis.",
        daysServed > 0
          ? `Moyenne : ${fmt(avgServed)} assiettes par jour de service.`
          : "Aucune assiette servie saisie.",
        peakServed && peakServed.served > 0
          ? `Jour le plus servi : ${formatDayFr(peakServed.date)} — ${fmt(peakServed.served)} assiettes.`
          : "Pas encore de jour de pointe.",
      ],
    },
    rab: {
      title: "RAB",
      lead: `${fmt(totals.rab)} RAB · ${rabRatePct} des assiettes servies.`,
      lines: [
        "RAB = assiettes adaptées ou resservies (petite faim, deuxième service, etc.).",
        peakRab && peakRab.rab > 0
          ? `Jour le plus de RAB : ${formatDayFr(peakRab.date)} — ${fmt(peakRab.rab)} (${peakRab.rabRatePct != null ? `${peakRab.rabRatePct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "taux n.d."}).`
          : "Aucun RAB saisi sur la période.",
        totals.served > 0
          ? "Un RAB régulier aide à limiter les restes, sans remplacer la pesée des déchets."
          : "Saisissez les servis pour calculer le taux de RAB.",
      ],
    },
    refused: {
      title: "Refus",
      lead: `${fmt(totals.refused)} refus · taux ${refusalRatePct}.`,
      lines: [
        "Un refus, c’est un élève qui n’a pas pris (ou a rendu) le plat ce jour-là.",
        peakRefused && peakRefused.refused > 0
          ? `Jour le plus de refus : ${formatDayFr(peakRefused.date)} — ${fmt(peakRefused.refused)} (${peakRefused.refusalRatePct != null ? `${peakRefused.refusalRatePct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "taux n.d."}).`
          : "Aucun refus saisi sur la période.",
        "Utile pour ajuster le menu du lendemain, surtout si le même plat revient.",
      ],
    },
    waste: {
      title: "Déchets (poids)",
      lead:
        totalWasteWeightG > 0 ? (
          <>
            {fmt(totalWasteWeightG)} g pesés sur {days} jours ·{" "}
            {levelFilter === "all" ? (
              levelNote
            ) : (
              <LevelFill level={levelFilter}>{levelNote}</LevelFill>
            )}
            .
          </>
        ) : (
          "Pas encore de pesée sur la période."
        ),
      lines: [
        totalWasteMaternelleG > 0 || totalWastePrimaireG > 0 ? (
          <span className="flex flex-wrap items-center gap-2">
            <span>Répartition :</span>
            <LevelFill level="MATERNELLE">
              maternelle {fmt(totalWasteMaternelleG)} g
            </LevelFill>
            <LevelFill level="PRIMAIRE">
              primaire {fmt(totalWastePrimaireG)} g
            </LevelFill>
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <span>Indiquez</span>
            <LevelFill level="MATERNELLE">maternelle</LevelFill>
            <span>et</span>
            <LevelFill level="PRIMAIRE">primaire</LevelFill>
            <span>à la pesée de fin de service.</span>
          </span>
        ),
        wasteGramsPer100Served != null
          ? `Soit ${wasteGramsPer100Served.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g de déchets pour 100 assiettes servies.`
          : "Le g / 100 apparaît dès qu’une pesée et des assiettes servies sont saisies.",
        peakWaste && peakWaste.wasteWeightG > 0
          ? `Jour le plus lourd : ${formatDayFr(peakWaste.date)} — ${fmt(peakWaste.wasteWeightG)} g${peakWaste.wasteGramsPer100 != null ? ` (${peakWaste.wasteGramsPer100.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g / 100)` : ""}.`
          : `${servicesWithWaste} service${servicesWithWaste > 1 ? "s" : ""} avec pesée.`,
      ],
    },
  };

  const active = open ? details[open] : null;
  const activeCard = open ? cards.find((c) => c.id === open) : null;
  const ActiveIcon = activeCard?.icon;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setOpen(card.id)}
              className={cn(
                "group rounded-3xl border-2 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                card.accent,
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-2xl",
                  card.iconWrap,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.08em] text-zinc-950">
                {card.label}
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular-nums tracking-tight text-zinc-950">
                {card.value}
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-zinc-800">
                {card.sub}
              </p>
              <p className="mt-3 text-xs font-bold text-zinc-700 group-hover:underline">
                Voir le détail
              </p>
            </button>
          );
        })}
      </div>

      <Dialog open={open != null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent
          className="z-[100] max-w-md rounded-3xl border-2 border-zinc-900"
          overlayClassName="z-[100]"
        >
          {active && activeCard && ActiveIcon ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-zinc-950">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl",
                      activeCard.iconWrap,
                    )}
                  >
                    <ActiveIcon className="size-4" aria-hidden />
                  </span>
                  {active.title}
                </DialogTitle>
                <DialogDescription className="text-base font-semibold leading-relaxed text-zinc-800">
                  {active.lead}
                </DialogDescription>
              </DialogHeader>
              <ul className="space-y-2.5">
                {active.lines.map((line, i) => (
                  <li
                    key={i}
                    className="rounded-2xl bg-zinc-50 px-3.5 py-3 text-base font-semibold leading-snug text-zinc-950"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
