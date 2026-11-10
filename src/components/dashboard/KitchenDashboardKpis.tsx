"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
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
import { formatServiceDateKey } from "@/lib/serviceDate";
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

const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

function shiftIsoDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatServiceDateKey(d);
}

function wasteGramsOfRow(row: DashboardDayDetailRow) {
  if (row.wasteWeightG > 0) return row.wasteWeightG;
  return row.wasteWeightMaternelleG + row.wasteWeightPrimaireG;
}

function mondayIndexFromIso(iso: string) {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return day === 0 ? 6 : day - 1;
}

function WeekWasteChart({
  rows,
  days,
}: {
  rows: DashboardDayDetailRow[];
  days: 7 | 30;
}) {
  const byDate = new Map<string, number>();
  for (const row of rows) {
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + wasteGramsOfRow(row));
  }
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const [date, grams] of byDate) {
    weekdayTotals[mondayIndexFromIso(date)] += grams;
  }
  const points = WEEKDAY_SHORT.map((label, i) => ({
    label,
    value: weekdayTotals[i] ?? 0,
  }));
  const total = points.reduce((sum, p) => sum + p.value, 0);
  const sortedDates = [...byDate.keys()].sort();
  const endIso =
    sortedDates.at(-1) ?? formatServiceDateKey(new Date());
  const last7start = shiftIsoDate(endIso, -6);
  const prev7start = shiftIsoDate(endIso, -13);
  let last7 = 0;
  let prev7 = 0;
  for (const [date, grams] of byDate) {
    if (date >= last7start && date <= endIso) last7 += grams;
    else if (date >= prev7start && date < last7start) prev7 += grams;
  }
  const deltaPct =
    days === 7 && prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null;
  const peak = Math.max(0, ...points.map((p) => p.value));
  const yMax = Math.max(1000, Math.ceil((peak || 1) / 250) * 250);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));
  const periodLabel = days === 30 ? "sur 30 jours" : "sur 7 jours";

  return (
    <div className="rounded-[1.5rem] bg-[#f8fafc] px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">
            Évolution
          </p>
          <p className="mt-0.5 text-base font-extrabold tracking-tight text-zinc-950 sm:text-lg">
            Vos déchets cette semaine
          </p>
          <p className="mt-0.5 text-xs font-medium text-zinc-400">
            Pesées de l’établissement {periodLabel}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold tabular-nums tracking-tight text-zinc-950">
            {fmt(total)} g
          </p>
          {deltaPct != null ? (
            <p
              className={cn(
                "mt-0.5 text-xs font-bold tabular-nums",
                deltaPct > 0 ? "text-orange-500" : "text-emerald-600",
              )}
            >
              {deltaPct > 0 ? "↗" : deltaPct < 0 ? "↘" : "→"}{" "}
              {Math.abs(deltaPct).toLocaleString("fr-FR", {
                maximumFractionDigits: 1,
              })}
              %
            </p>
          ) : (
            <p className="mt-0.5 text-xs font-medium text-zinc-400">
              vs semaine d’avant
            </p>
          )}
        </div>
      </div>
      <div className="mt-5 flex gap-2.5">
        <div className="flex h-44 flex-col justify-between pb-6 text-right text-[10px] font-semibold tabular-nums text-zinc-400">
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{tick.toLocaleString("fr-FR")}g</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44">
            {yTicks.slice(1).map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-zinc-200/80"
                style={{ bottom: `${(tick / yMax) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex h-44 items-end justify-between gap-2">
            {points.map((point) => {
              const h = yMax > 0 ? (point.value / yMax) * 100 : 0;
              const isPeak = peak > 0 && point.value === peak;
              return (
                <div
                  key={point.label}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >
                  <div
                    className="w-[72%] max-w-[2.15rem] rounded-t-[10px]"
                    style={{
                      height: `${point.value > 0 ? Math.max(h, 8) : 0}%`,
                      background: isPeak
                        ? "linear-gradient(180deg, #fdba74 0%, #f97316 100%)"
                        : "linear-gradient(180deg, #86efac 0%, #22c55e 100%)",
                    }}
                    title={`${point.label} : ${fmt(point.value)} g`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between gap-2 border-t border-zinc-200 pt-2">
            {points.map((point) => (
              <span
                key={`${point.label}-lbl`}
                className={cn(
                  "min-w-0 flex-1 text-center text-[11px] font-semibold",
                  peak > 0 && point.value === peak
                    ? "text-orange-600"
                    : "text-zinc-500",
                )}
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
    link: string;
  }[] = [
    {
      id: "present",
      icon: Users,
      label: "Élèves présents",
      value: fmt(totals.present),
      sub: `${daysPresent} jour${daysPresent > 1 ? "s" : ""} de service`,
      accent: "bg-white",
      iconWrap: "bg-emerald-500 text-white",
      link: "text-emerald-600",
    },
    {
      id: "served",
      icon: UtensilsCrossed,
      label: "Assiettes servies",
      value: fmt(totals.served),
      sub: `${servedVsPresentPct} des présents`,
      accent: "bg-[#eafbf1]",
      iconWrap: "bg-emerald-600 text-white",
      link: "text-emerald-700",
    },
    {
      id: "rab",
      icon: Repeat2,
      label: "RAB",
      value: fmt(totals.rab),
      sub: `${rabRatePct} des servis`,
      accent: "bg-[#e7f6fb]",
      iconWrap: "bg-sky-400 text-white",
      link: "text-sky-500",
    },
    {
      id: "refused",
      icon: Ban,
      label: "Refus",
      value: fmt(totals.refused),
      sub: `Taux ${refusalRatePct}`,
      accent: "bg-[#fdecef]",
      iconWrap: "bg-rose-400 text-white",
      link: "text-rose-500",
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
      accent: "bg-[#fff6e8]",
      iconWrap: "bg-amber-400 text-white",
      link: "text-amber-500",
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
                "group rounded-[26px] p-4 text-left shadow-[0_12px_28px_-18px_rgba(24,24,27,0.28)] transition hover:-translate-y-0.5 hover:shadow-md",
                card.accent,
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  card.iconWrap,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-zinc-950">
                {card.label}
              </p>
              <p className="mt-1 font-display text-[2rem] font-extrabold leading-none tabular-nums tracking-tight text-zinc-950">
                {card.value}
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-zinc-600">
                {card.sub}
              </p>
              <p
                className={cn(
                  "mt-4 inline-flex items-center gap-1 text-xs font-bold",
                  card.link,
                )}
              >
                Voir le détail
                <ArrowRight className="size-3.5" aria-hidden />
              </p>
            </button>
          );
        })}
      </div>

      <Dialog open={open != null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent
          className={cn(
            "z-[100] rounded-3xl border-2 border-zinc-900",
            open === "waste" ? "max-w-xl sm:p-6" : "max-w-md",
          )}
          overlayClassName="z-[100]"
        >
          {active && activeCard && ActiveIcon ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-zinc-950">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full",
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
              {open === "waste" ? (
                <WeekWasteChart rows={perDayRows} days={days} />
              ) : null}
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
