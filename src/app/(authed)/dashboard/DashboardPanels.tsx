"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CantinePulseCard } from "@/components/CantinePulseCard";
import { LeftoversEvolutionChart } from "@/components/dashboard/LeftoversEvolutionChart";
import type { CantineServiceRow } from "@/lib/cantinePulse";

type Totals = {
  present: number;
  served: number;
  refused: number;
  leftovers: number;
};

type TopRow = { group: string; leftovers: number };
type DayRow = {
  date: string;
  mealLabel: string;
  present: number;
  served: number;
  refused: number;
  leftovers: number;
};

export type DashboardEcoGroupRow = {
  groupName: string;
  restesServisTargetPct: number | null;
  reductionTargetPct: number | null;
  ytd: { leftovers: number; served: number };
  priorYtdLeftovers: number;
};

export type DashboardEcoPayload = {
  groupsLunch: DashboardEcoGroupRow[];
  groupsDinner: DashboardEcoGroupRow[];
  periodTitle: string;
  restesParen: string;
  priorPhrase: string;
};

export default function DashboardPanels({
  days,
  role,
  exportYear,
  pulseRows,
  eco,
  totals,
  leftoversRatePct,
  refusalRatePct,
  servedVsPresentPct,
  top,
  perDayRows,
}: {
  days: 7 | 30;
  role: "ADMIN" | "KITCHEN";
  exportYear: number;
  pulseRows: CantineServiceRow[];
  eco: DashboardEcoPayload | null;
  totals: Totals;
  leftoversRatePct: string;
  refusalRatePct: string;
  servedVsPresentPct: string;
  top: TopRow[];
  perDayRows: DayRow[];
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
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

      <div className="grid grid-cols-2 items-stretch gap-1.5 sm:grid-cols-4 sm:gap-2">
        {kpis.map((item, i) => (
          <motion.div
            key={item.label}
            className="h-full"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Card className="h-full w-full gap-0 rounded-xl border-2 border-emerald-600 bg-card/50 py-0 shadow-none backdrop-blur-sm dark:border-emerald-500">
              <CardContent className="flex h-full flex-col p-1.5 sm:p-2.5 sm:px-3">
                <p className="text-xs leading-tight text-muted-foreground">
                  <span className="!font-bold">{item.label}</span>
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-2xl">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <CantinePulseCard
          rows={pulseRows}
          mealType="LUNCH"
          eco={
            eco
              ? {
                  groups: eco.groupsLunch,
                  periodTitle: eco.periodTitle,
                  restesParen: eco.restesParen,
                  priorPhrase: eco.priorPhrase,
                }
              : null
          }
        />
        <CantinePulseCard
          rows={pulseRows}
          mealType="DINNER"
          eco={
            eco
              ? {
                  groups: eco.groupsDinner,
                  periodTitle: eco.periodTitle,
                  restesParen: eco.restesParen,
                  priorPhrase: eco.priorPhrase,
                }
              : null
          }
        />
      </div>

      <LeftoversEvolutionChart days={days} perDayRows={perDayRows} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Restes par groupe (top)
            </h2>
            {top.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Pas de données.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {top.map((g) => (
                  <li
                    key={g.group}
                    className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{g.group}</span>
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">
                        {g.leftovers.toLocaleString("fr-FR")}
                      </strong>{" "}
                      restes
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Détails par service
            </h2>
            {perDayRows.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Pas de données.</p>
            ) : (
              <div className="mt-4 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Repas</th>
                      <th className="py-2 pr-3">Présents</th>
                      <th className="py-2 pr-3">Servis</th>
                      <th className="py-2 pr-3">Refus</th>
                      <th className="py-2">Restes</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {perDayRows.map((row) => (
                      <tr key={`${row.date}-${row.mealLabel}`} className="border-t border-border/60">
                        <td className="py-2 pr-3 font-medium">{row.date}</td>
                        <td className="py-2 pr-3">{row.mealLabel}</td>
                        <td className="py-2 pr-3">
                          {row.present.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {row.served.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {row.refused.toLocaleString("fr-FR")}
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
