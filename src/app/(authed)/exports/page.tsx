"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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

type PeriodPresetId = "today" | "7d" | "30d" | "month" | "year" | "all" | "custom";

const ALL_FROM = "2020-01-01";

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
    case "all":
      return { from: ALL_FROM, to };
  }
}

function presetOptions() {
  const today = todayYyyyMmDd();
  const r7 = computePresetRange("7d");
  const r30 = computePresetRange("30d");
  const rMonth = computePresetRange("month");
  const rYear = computePresetRange("year");
  const rAll = computePresetRange("all");

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
      id: "all" as const,
      label: "Toutes les dates précédentes",
      detail: `Du ${formatFrDate(rAll.from)} au ${formatFrDate(rAll.to)}`,
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Exports</h1>
        <p className="w-full text-base font-semibold text-zinc-900 sm:text-lg">
          Téléchargements CSV pour Excel — métriques de service et menus allergènes
        </p>
        <p className="w-full text-base leading-relaxed text-zinc-700 sm:text-lg">
          Choisissez une <strong className="font-semibold text-zinc-900">période</strong>, puis
          exportez les compteurs cantine (présents, servis, RAB, refus, restes par classe) ou les{" "}
          <strong className="font-semibold text-zinc-900">menus du jour</strong> avec le détail des
          allergènes. Idéal pour la commission, les bilans et le partage avec l&apos;administration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Période</CardTitle>
            <CardDescription>
              Choisissez une période rapide ou ajustez les dates Du / Au.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="period-preset">Période rapide</Label>
              <Select value={preset} onValueChange={(v) => applyPreset(v as PeriodPresetId)}>
                <SelectTrigger id="period-preset" className="h-auto min-h-9 w-full py-2">
                  <SelectValue placeholder="Choisir une période" />
                </SelectTrigger>
                <SelectContent>
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

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Télécharger</CardTitle>
            <CardDescription>Fichiers prêts pour Excel.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <a href={`/api/exports/services?${qs}`}>CSV Services (métriques)</a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/api/exports/menus?${qs}`}>CSV Menus (allergènes)</a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Période sélectionnée&nbsp;: {formatFrRange(from, to)}.
            </p>
            <p className="text-xs text-muted-foreground">
              Astuce&nbsp;: sur tablette, le téléchargement dépend du navigateur.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
