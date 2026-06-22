"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CantinePulseCard } from "@/components/CantinePulseCard";
import { LeftoversEvolutionChart } from "@/components/dashboard/LeftoversEvolutionChart";
import { LeftoversByGroupTop } from "@/components/dashboard/LeftoversByGroupTop";
import type { PerDayRowInput } from "@/lib/buildLeftoversEvolutionSeries";
import type { CantineServiceRow } from "@/lib/cantinePulse";
import { GROUP_CARD_COLORS } from "@/lib/groupCardColors";

type Totals = {
  present: number;
  served: number;
  rab: number;
  refused: number;
  leftovers: number;
};

type TopRow = { group: string; leftovers: number };

type DashboardDayRow = PerDayRowInput & {
  present: number;
  rab: number;
};

export type DashboardEcoGroupRow = {
  groupName: string;
  restesServisTargetPct: number | null;
  reductionTargetPct: number | null;
  ytd: { leftovers: number; served: number };
  priorYtdLeftovers: number;
};

export type DashboardEcoPayload = {
  groups: DashboardEcoGroupRow[];
  periodTitle: string;
  restesParen: string;
  priorPhrase: string;
};

export default function DashboardPanels({
  days,
  schoolNames,
  role,
  exportYear,
  pulseRows,
  eco,
  totals,
  leftoversRatePct,
  refusalRatePct,
  rabRatePct,
  servedVsPresentPct,
  top,
  perDayRows,
}: {
  days: 7 | 30;
  schoolNames: string[];
  role: "ADMIN" | "KITCHEN";
  exportYear: number;
  pulseRows: CantineServiceRow[];
  eco: DashboardEcoPayload | null;
  totals: Totals;
  leftoversRatePct: string;
  refusalRatePct: string;
  rabRatePct: string;
  servedVsPresentPct: string;
  top: TopRow[];
  perDayRows: DashboardDayRow[];
}) {
  const kpis = [
    {
      label: "Élèves présents",
      value: totals.present.toLocaleString("fr-FR"),
    },
    {
      label: "Servis",
      value: totals.served.toLocaleString("fr-FR"),
      sub: `vs présents : ${servedVsPresentPct}`,
    },
    {
      label: "RAB",
      value: totals.rab.toLocaleString("fr-FR"),
      sub: `vs servis : ${rabRatePct}`,
    },
    {
      label: "Refus",
      value: totals.refused.toLocaleString("fr-FR"),
      sub: `taux : ${refusalRatePct}`,
    },
    {
      label: "Restes",
      value: totals.leftovers.toLocaleString("fr-FR"),
      sub: `taux : ${leftoversRatePct}`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bienvenue sur votre tableau de bord
            {schoolNames.length === 1 ? (
              <>
                <span aria-hidden> — </span>
                <span className="text-emerald-700">{schoolNames[0]}</span>
              </>
            ) : null}
          </h1>
          {schoolNames.length > 1 ? (
            <p className="mt-1 text-sm text-zinc-700 sm:text-base">
              <span className="font-medium text-zinc-600">Écoles suivies : </span>
              {schoolNames.map((name, index) => (
                <span key={name}>
                  {index > 0 ? (
                    <span aria-hidden className="text-zinc-400">
                      {" "}
                      ·{" "}
                    </span>
                  ) : null}
                  <span className="font-semibold text-emerald-700">{name}</span>
                </span>
              ))}
            </p>
          ) : null}
          <p className="mt-1 text-muted-foreground">
            Indicateurs sur les {days} derniers jours
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={days === 7 ? "default" : "outline"} asChild>
            <Link href="/dashboard?days=7">7 jours</Link>
          </Button>
          <Button variant={days === 30 ? "default" : "outline"} asChild>
            <Link href="/dashboard?days=30">30 jours</Link>
          </Button>
          {role === "ADMIN" ? (
            <Button variant="outline" asChild>
              <a
                href={`/api/exports/commission-bilan?year=${exportYear}`}
                download
                className="inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" aria-hidden />
                Bilan commission (CSV)
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-base font-semibold leading-snug text-zinc-900 sm:text-lg">
        Aperçu de la page — chiffres clés du déjeuner, note{" "}
        <span className="whitespace-nowrap">Cantine +</span>, évolution des restes, top des
        classes et détail jour par jour sur les {days} derniers jours.
      </p>

      <div className="grid grid-cols-2 items-stretch gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-5">
        {kpis.map((item, i) => (
          <motion.div
            key={item.label}
            className="flex h-full flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <p className="mb-1.5 text-center text-sm font-bold leading-tight text-zinc-900 sm:mb-2 sm:text-base">
              {item.label}
            </p>
            <Card className="h-full w-full flex-1 gap-0 rounded-xl border-2 border-emerald-600 bg-card/50 py-0 shadow-none backdrop-blur-sm dark:border-emerald-500">
              <CardContent className="flex h-full flex-col justify-center p-1.5 sm:p-2.5 sm:px-3">
                <p className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-2xl">
                  {item.value}
                </p>
                <p className="mt-0.5 min-h-[2rem] line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:min-h-[2.25rem] sm:text-xs">
                  {"sub" in item && item.sub ? (
                    <span className="!font-bold">{item.sub}</span>
                  ) : (
                    <span className="invisible select-none" aria-hidden>
                      —
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <CantinePulseCard
        rows={pulseRows}
        mealType="LUNCH"
        eco={
          eco
            ? {
                groups: eco.groups,
                periodTitle: eco.periodTitle,
                restesParen: eco.restesParen,
                priorPhrase: eco.priorPhrase,
              }
            : null
        }
      />

      <LeftoversEvolutionChart days={days} perDayRows={perDayRows} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LeftoversByGroupTop top={top} />

        <Card
          className="border-border/50 backdrop-blur-sm"
          style={{ backgroundColor: GROUP_CARD_COLORS[4] }}
        >
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Détails par service
            </h2>
            {perDayRows.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Pas de données.</p>
            ) : (
              <div className="mt-4 max-h-80 overflow-y-auto overflow-x-auto rounded-xl border border-black/10 bg-white pr-1 [scrollbar-gutter:stable]">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white text-left text-xs font-semibold text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
                    <tr>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Présents</th>
                      <th className="py-2 pr-3">Servis</th>
                      <th className="py-2 pr-3">RAB</th>
                      <th className="py-2 pr-3">Refus</th>
                      <th className="py-2">Restes</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {perDayRows.map((row) => (
                      <tr key={row.date} className="border-t border-border/60">
                        <td className="py-2 pr-3 font-medium">{row.date}</td>
                        <td className="py-2 pr-3">
                          {row.present.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {row.served.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {row.rab.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {(row.refused ?? 0).toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2">
                          {row.leftovers.toLocaleString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
