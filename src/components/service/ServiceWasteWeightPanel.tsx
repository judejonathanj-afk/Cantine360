"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CloudOff, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ServiceInsightCard } from "@/components/service/ServiceInsightCard";
import { formatKgFromGrams } from "@/lib/serviceGrammage";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

function gramsToKgInput(grams: number | null): string {
  if (grams == null || grams <= 0) return "";
  const kg = grams / 1000;
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(2).replace(/\.?0+$/, "");
}

function parseKgToGrams(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const kg = Number(trimmed);
  if (!Number.isFinite(kg) || kg < 0) return null;
  return Math.round(kg * 1000);
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
  const [kgInput, setKgInput] = useState(() => gramsToKgInput(initialWasteWeightG));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "offline">(
    "idle",
  );
  const saveTimer = useRef<number | null>(null);

  const dirty = parseKgToGrams(kgInput) !== savedGrams;

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
        setSavedGrams(data.service.wasteWeightG);
        setKgInput(gramsToKgInput(data.service.wasteWeightG));
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
      void save(parseKgToGrams(kgInput));
    }, 500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [dirty, kgInput, save]);

  const previewGrams = parseKgToGrams(kgInput);
  const metric =
    savedGrams != null && savedGrams > 0 ? (
      formatKgFromGrams(savedGrams)
    ) : (
      <span className="text-lg font-semibold">—</span>
    );

  return (
    <ServiceInsightCard
      tone="amber"
      icon={Trash2}
      title="Grammage des déchets"
      subtitle="Après le service"
      metric={metric}
      className={cn(className)}
    >
      <div className="mt-2 space-y-2">
        <Label htmlFor={`waste-weight-${serviceId}`} className="text-sm text-white/90">
          Poids total des déchets (kg)
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={`waste-weight-${serviceId}`}
            type="text"
            inputMode="decimal"
            placeholder="ex. 8,5"
            value={kgInput}
            onChange={(e) => setKgInput(e.target.value)}
            className="max-w-[8rem] border-white/30 bg-white/95 text-zinc-900 placeholder:text-zinc-500"
          />
          <span className="text-sm text-white/85">
            {previewGrams != null && previewGrams > 0
              ? `= ${previewGrams.toLocaleString("fr-FR")} g`
              : "Pesée globale (bac, compost, table…)"}
          </span>
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
