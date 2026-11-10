"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Download, FileSpreadsheet } from "lucide-react";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { DashboardFoldOverlay } from "@/components/dashboard/DashboardFoldOverlay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PeriodPresetId = "today" | "7d" | "30d" | "month" | "year" | "12m" | "custom";

function formatYyyyMmDd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayYyyyMmDd() {
  return formatYyyyMmDd(new Date());
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatYyyyMmDd(d);
}

function formatFrDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

function formatFrRange(from: string, to: string) {
  if (from === to) return formatFrDate(from);
  return `${formatFrDate(from)} – ${formatFrDate(to)}`;
}

function computePresetRange(id: Exclude<PeriodPresetId, "custom">) {
  const to = todayYyyyMmDd();
  switch (id) {
    case "today":
      return { from: to, to };
    case "7d":
      return { from: addDays(to, -6), to };
    case "30d":
      return { from: addDays(to, -29), to };
    case "month": {
      const d = new Date();
      const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      return { from, to };
    }
    case "year":
      return { from: `${new Date().getFullYear()}-01-01`, to };
    case "12m":
      // Plafond API = 400 j ; 365 j glissants restent confortables pour Excel.
      return { from: addDays(to, -364), to };
  }
}

function presetOptions() {
  const today = todayYyyyMmDd();
  const r7 = computePresetRange("7d");
  const r30 = computePresetRange("30d");
  const rMonth = computePresetRange("month");
  const rYear = computePresetRange("year");
  const r12 = computePresetRange("12m");

  return [
    { id: "today" as const, label: "Aujourd'hui", detail: formatFrDate(today) },
    {
      id: "7d" as const,
      label: "7 derniers jours",
      detail: formatFrRange(r7.from, r7.to),
    },
    {
      id: "30d" as const,
      label: "30 derniers jours",
      detail: formatFrRange(r30.from, r30.to),
    },
    {
      id: "month" as const,
      label: "Mois en cours",
      detail: formatFrRange(rMonth.from, rMonth.to),
    },
    {
      id: "year" as const,
      label: "Année en cours",
      detail: formatFrRange(rYear.from, rYear.to),
    },
    {
      id: "12m" as const,
      label: "12 derniers mois",
      detail: formatFrRange(r12.from, r12.to),
    },
    { id: "custom" as const, label: "Personnalisé", detail: "Ajuster Du / Au ci-dessous" },
  ];
}

export default function ExportsPage() {
  const today = todayYyyyMmDd();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [preset, setPreset] = useState<PeriodPresetId>("today");

  const options = useMemo(() => presetOptions(), []);

  const qs = useMemo(
    () => `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    [from, to],
  );

  function applyPreset(id: PeriodPresetId) {
    setPreset(id);
    if (id === "custom") return;
    const range = computePresetRange(id);
    setFrom(range.from);
    setTo(range.to);
  }

  return (
    <div className="space-y-8">
      <div className="w-full space-y-3">
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 shadow-lg md:rounded-2xl md:px-7 md:py-3">
            <MenusCantineColorTitle
              text="EXPORTS"
              className="text-xl md:text-2xl lg:text-3xl"
            />
          </div>
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-4xl">
          Téléchargements CSV pour Excel
          <span className="mt-1 block text-emerald-600">
            métriques de service et menus allergènes.
          </span>
        </h2>
        <p className="w-full text-base leading-relaxed text-zinc-700 sm:text-lg">
          Choisissez une <strong className="font-semibold text-zinc-900">période</strong>, puis
          exportez les compteurs cantine (présents, servis, RAB, refus par classe), le{" "}
          <strong className="font-semibold text-zinc-900">poids des déchets par service</strong>{" "}
          ou les <strong className="font-semibold text-zinc-900">menus du jour</strong>
          {" "}
          avec le détail des allergènes. Idéal pour la commission, les bilans et le partage avec
          l&apos;administration.
        </p>
      </div>

      <DashboardFoldOverlay
        kicker="CSV"
        openLabel="Ouvrir Exports"
        overlayTitle="Exports"
        subtitle="Téléchargements CSV pour Excel — métriques de service et menus allergènes."
        hint="Choisissez une période, puis téléchargez les services (métriques + déchets) ou les menus allergènes."
        icon={Download}
        labelledBy="exports-overlay-title"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        bodyClassName="overflow-y-scroll pr-1.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-100"
      >
      <div className="grid gap-4 p-1 md:grid-cols-2 sm:p-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Période</CardTitle>
            <CardDescription>
              Choisissez une période rapide ou ajustez les dates Du / Au (max 400
              jours).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="period-preset">Période rapide</Label>
              <Select value={preset} onValueChange={(v) => applyPreset(v as PeriodPresetId)}>
                <SelectTrigger id="period-preset" className="h-auto min-h-9 w-full py-2">
                  <SelectValue placeholder="Choisir une période" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  {options.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label} — {opt.detail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">Du</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">Au</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-zinc-950">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <FileSpreadsheet className="size-5" aria-hidden />
              </span>
              Vos données, prêtes à partager
            </CardTitle>
            <CardDescription className="text-sm font-medium text-zinc-500">
              Préparez le bilan de votre restauration scolaire.
            </CardDescription>
            <p className="pt-1 text-sm font-semibold text-emerald-800">
              Cliquez sur le fichier ou une ligne ci-dessous pour télécharger.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <a
              href={`/api/exports/services?${qs}`}
              className="flex flex-col items-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/80 px-4 py-8 text-center transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
                <FileSpreadsheet className="size-7 text-emerald-800" aria-hidden />
              </span>
              <p className="mt-4 text-base font-extrabold tracking-tight text-zinc-950">
                bilan-cantine-exemple.csv
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                Repas · déchets · période · niveaux
              </p>
              <p className="mt-2 text-sm font-bold text-emerald-800">Télécharger</p>
            </a>
            <ul className="mt-1">
              {[
                {
                  href: `/api/exports/services?${qs}`,
                  label: "Suivi des services",
                },
                {
                  href: `/api/exports/services?${qs}`,
                  label: "Pesées maternelle / primaire",
                },
                {
                  href: `/api/exports/services?${qs}`,
                  label: "Indicateurs par période",
                },
                {
                  href: `/api/exports/menus?${qs}`,
                  label: "Menus (allergènes)",
                },
              ].map((row) => (
                <li key={row.label} className="border-t border-zinc-200">
                  <a
                    href={row.href}
                    className="flex items-center gap-3 py-3.5 text-sm font-semibold text-zinc-900 transition hover:text-emerald-800"
                  >
                    <Check className="size-4 shrink-0 text-emerald-700" strokeWidth={2.5} aria-hidden />
                    <span className="min-w-0 flex-1">{row.label}</span>
                    <ChevronRight className="size-4 shrink-0 text-zinc-400" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      </DashboardFoldOverlay>
    </div>
  );
}
