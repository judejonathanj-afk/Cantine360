"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CloudOff, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { formatKgFromGrams } from "@/lib/serviceGrammage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

function gramsToInput(grams: number | null): string {
  if (grams == null || grams <= 0) return "";
  return String(grams);
}

function parseGramsInput(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
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
  const [weightInput, setWeightInput] = useState(() => gramsToInput(initialWasteWeightG));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "offline">(
    "idle",
  );
  const saveTimer = useRef<number | null>(null);

  const parsedGrams = parseGramsInput(weightInput);
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
        setWeightInput(gramsToInput(nextGrams));
        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 800);
        return true;
      } catch {
        setStatus("offline");
        return false;
      }
    },
    [online, serviceId],
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

  const metric =
    savedGrams != null && savedGrams > 0 ? (
      <>
        {savedGrams.toLocaleString("fr-FR")} g
        <span className="ml-1 text-sm font-medium text-white/80">
          ({formatKgFromGrams(savedGrams)})
        </span>
      </>
    ) : (
      <span className="text-lg font-semibold">—</span>
    );

  const conversionHint =
    parsedGrams != null && parsedGrams > 0
      ? `= ${formatKgFromGrams(parsedGrams)}`
      : "Pesée globale (bac, compost, table…)";

  return (
    <ServiceInsightCard
      tone="emerald"
      icon={Trash2}
      title="Grammage des déchets"
      subtitle="Après le service"
      metric={metric}
      centeredHeader
      className={cn(className)}
    >
      <div className="mt-4 flex flex-col items-center gap-3 text-center">
        <Label
          htmlFor={`waste-weight-${serviceId}`}
          className="text-base font-medium text-white sm:text-lg"
        >
          Poids total des déchets (g)
        </Label>
        <Input
          id={`waste-weight-${serviceId}`}
          type="text"
          inputMode="numeric"
          placeholder="ex. 8500"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          className="h-14 w-full max-w-[14rem] border-white/30 bg-white/95 text-center text-xl font-semibold text-zinc-900 placeholder:text-base placeholder:font-normal placeholder:text-zinc-500 sm:text-2xl"
        />
        <span className="max-w-md text-base text-white/90 sm:text-lg">{conversionHint}</span>
        <p className="flex items-center justify-center gap-1.5 text-sm text-white/80 sm:text-base">
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
