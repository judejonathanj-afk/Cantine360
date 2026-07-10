"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CloudOff, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { formatKgFromGrams } from "@/lib/serviceGrammage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

type WasteUnit = "g" | "kg";

function defaultUnitForGrams(grams: number | null): WasteUnit {
  if (grams != null && grams > 0 && grams < 1000) return "g";
  return "kg";
}

function gramsToInput(grams: number | null, unit: WasteUnit): string {
  if (grams == null || grams <= 0) return "";
  if (unit === "kg") {
    const kg = grams / 1000;
    return Number.isInteger(kg) ? String(kg) : kg.toFixed(2).replace(/\.?0+$/, "");
  }
  return String(grams);
}

function parseInputToGrams(raw: string, unit: WasteUnit): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  if (unit === "kg") return Math.round(value * 1000);
  return Math.round(value);
}

function formatGramsPreview(grams: number): string {
  return `${grams.toLocaleString("fr-FR")} g`;
}

export function ServiceWasteWeightPanel({
  serviceId,
  initialWasteWeightG,
  className,
}: {
  serviceId: string;
  initialWasteWeightG: number | null;
  className?: string;
}) {
  const online = useOnlineStatus();
  const [savedGrams, setSavedGrams] = useState<number | null>(initialWasteWeightG);
  const [unit, setUnit] = useState<WasteUnit>(() =>
    defaultUnitForGrams(initialWasteWeightG),
  );
  const [weightInput, setWeightInput] = useState(() =>
    gramsToInput(initialWasteWeightG, defaultUnitForGrams(initialWasteWeightG)),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "offline">(
    "idle",
  );
  const saveTimer = useRef<number | null>(null);

  const parsedGrams = parseInputToGrams(weightInput, unit);
  const dirty = parsedGrams !== savedGrams;

  const save = useCallback(
    async (grams: number | null) => {
      if (!online) {
        setStatus("offline");
        return false;
      }

      setStatus("saving");
      try {
        const res = await fetch(`/api/services/${serviceId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ wasteWeightG: grams }),
        });
        if (!res.ok) {
          setStatus("error");
          return false;
        }
        const data = (await res.json()) as { service: { wasteWeightG: number | null } };
        const nextGrams = data.service.wasteWeightG;
        setSavedGrams(nextGrams);
        setWeightInput(gramsToInput(nextGrams, unit));
        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 800);
        return true;
      } catch {
        setStatus("offline");
        return false;
      }
    },
    [online, serviceId, unit],
  );

  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void save(parsedGrams);
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [dirty, parsedGrams, save]);

  function onUnitChange(nextUnit: WasteUnit) {
    if (nextUnit === unit) return;
    const grams = parseInputToGrams(weightInput, unit);
    setUnit(nextUnit);
    setWeightInput(gramsToInput(grams, nextUnit));
  }

  const metric =
    savedGrams != null && savedGrams > 0 ? (
      <>
        {formatKgFromGrams(savedGrams)}
        <span className="ml-1 text-sm font-medium text-white/80">
          ({formatGramsPreview(savedGrams)})
        </span>
      </>
    ) : (
      <span className="text-lg font-semibold">—</span>
    );

  const conversionHint =
    parsedGrams != null && parsedGrams > 0
      ? unit === "kg"
        ? `= ${formatGramsPreview(parsedGrams)}`
        : `= ${formatKgFromGrams(parsedGrams)}`
      : "Pesée globale (bac, compost, table…)";

  return (
    <ServiceInsightCard
      tone="emerald"
      icon={Trash2}
      title="Grammage des déchets"
      subtitle="Après le service"
      metric={metric}
      className={cn(className)}
    >
      <div className="mt-2 space-y-2">
        <Label htmlFor={`waste-weight-${serviceId}`} className="text-sm text-white/90">
          Poids total des déchets
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={`waste-weight-${serviceId}`}
            type="text"
            inputMode="decimal"
            placeholder={unit === "kg" ? "ex. 8,5" : "ex. 8500"}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            className="max-w-[8rem] border-white/30 bg-white/95 text-zinc-900 placeholder:text-zinc-500"
          />
          <ToggleGroup
            type="single"
            value={unit}
            onValueChange={(v) => {
              if (v === "g" || v === "kg") onUnitChange(v);
            }}
            className="rounded-lg border border-white/30 bg-white/15 p-0.5"
          >
            <ToggleGroupItem
              value="g"
              aria-label="Grammes"
              className="min-w-10 border-0 bg-transparent px-3 text-white data-[state=on]:bg-white data-[state=on]:text-emerald-700"
            >
              g
            </ToggleGroupItem>
            <ToggleGroupItem
              value="kg"
              aria-label="Kilogrammes"
              className="min-w-10 border-0 bg-transparent px-3 text-white data-[state=on]:bg-white data-[state=on]:text-emerald-700"
            >
              kg
            </ToggleGroupItem>
          </ToggleGroup>
          <span className="text-sm text-white/85">{conversionHint}</span>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-white/80">
          {status === "saving" ? (
            "Enregistrement…"
          ) : status === "saved" ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden />
              Enregistré
            </>
          ) : status === "offline" ? (
            <>
              <CloudOff className="h-3.5 w-3.5" aria-hidden />
              Hors ligne — réessayez quand la connexion revient
            </>
          ) : status === "error" ? (
            "Erreur à l’enregistrement"
          ) : (
            "Saisie automatique après quelques secondes"
          )}
        </p>
      </div>
    </ServiceInsightCard>
  );
}
