"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, CloudOff, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SERVICE_INSIGHT_TONES } from "@/components/service/serviceInsightTones";
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

  const parsedGrams = parseGramsInput(weightInput);
  const dirty = parsedGrams !== savedGrams;
  const invalidInput = weightInput.trim() !== "" && parsedGrams === null;
  const canSave = dirty && !invalidInput && online && status !== "saving";

  useEffect(() => {
    setSavedGrams(initialWasteWeightG);
    setWeightInput(gramsToInput(initialWasteWeightG));
    setStatus("idle");
  }, [serviceId, initialWasteWeightG]);

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

  const savedDisplay = savedGrams ?? 0;

  const metric = (
    <>
      {savedDisplay.toLocaleString("fr-FR")} g
      <span className="ml-1 text-sm font-medium text-white/80">
        ({formatKgFromGrams(savedDisplay)})
      </span>
    </>
  );

  const conversionHint =
    parsedGrams != null && parsedGrams > 0
      ? `= ${formatKgFromGrams(parsedGrams)}`
      : "Pesée globale (bac, compost, table…)";

  const t = SERVICE_INSIGHT_TONES.emerald;

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border shadow-md", t.shell, className)}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[4.5rem] overflow-hidden sm:w-28 md:w-36 lg:w-44"
        aria-hidden
      >
        <Trash2
          className="absolute right-0 top-1/2 h-52 w-52 -translate-y-1/2 text-white/25 sm:h-64 sm:w-64 md:h-80 md:w-80 lg:h-96 lg:w-96"
          strokeWidth={1.25}
        />
      </div>

      <div className="relative z-10 flex min-h-[18rem] flex-col items-center justify-center px-4 py-5 text-center sm:min-h-[20rem] sm:px-6 sm:py-6">
        <div className="flex w-full max-w-lg flex-col items-center gap-2">
          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                t.icon,
              )}
            >
              <Trash2 className="h-6 w-6" aria-hidden />
            </span>
            <h2 className={cn("text-lg font-semibold leading-snug sm:text-xl", t.text)}>
              Grammage des déchets
            </h2>
          </div>
          <p className={cn("max-w-xl text-sm leading-relaxed sm:text-base", t.muted)}>
            Après le service — enregistré pour ce déjeuner uniquement
          </p>
        </div>

        <div className={cn("mt-3 text-3xl font-bold tracking-tight", t.text)}>{metric}</div>

        <div className="mt-4 flex w-full max-w-lg flex-col items-center gap-3">
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
            <Button
              type="button"
              size="lg"
              disabled={!canSave}
              onClick={() => void save(parsedGrams)}
              className="h-12 min-w-[11rem] rounded-xl border border-white/40 bg-white font-semibold text-emerald-800 shadow-sm hover:bg-white/95 disabled:border-white/20 disabled:bg-white/50 disabled:text-emerald-800/50"
            >
              <Save className="h-4 w-4 shrink-0" aria-hidden />
              {status === "saving" ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-sm text-white/80 sm:text-base">
              {invalidInput ? (
                "Saisissez un nombre de grammes valide"
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
                "Erreur à l’enregistrement — réessayez"
              ) : dirty ? (
                "Modifications non enregistrées"
              ) : (
                "Appuyez sur Enregistrer après la pesée"
              )}
            </p>
        </div>
      </div>
    </div>
  );
}
