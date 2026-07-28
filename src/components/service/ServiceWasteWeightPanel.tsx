"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CloudOff, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKgFromGrams } from "@/lib/serviceGrammage";
import { totalWasteFromLevels } from "@/lib/serviceWasteByLevel";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import {
  enqueueWasteSave,
  getQueuedWaste,
  removeQueuedWaste,
} from "@/lib/offlineWasteQueue";
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

type LevelWeights = {
  MATERNELLE: number | null;
  PRIMAIRE: number | null;
};

const LEVEL_PANEL: Record<
  SchoolLevel,
  { shell: string; inputBorder: string }
> = {
  MATERNELLE: {
    shell: "bg-emerald-600",
    inputBorder: "border-emerald-300 focus-visible:ring-emerald-400",
  },
  PRIMAIRE: {
    shell: "bg-sky-600",
    inputBorder: "border-sky-300 focus-visible:ring-sky-400",
  },
};

export function ServiceWasteWeightPanel({
  serviceId,
  initialWasteWeightG,
  initialWasteWeightMaternelleG,
  initialWasteWeightPrimaireG,
  className,
}: {
  serviceId: string;
  initialWasteWeightG: number | null;
  initialWasteWeightMaternelleG?: number | null;
  initialWasteWeightPrimaireG?: number | null;
  className?: string;
}) {
  const online = useOnlineStatus();

  const initialLevels = (): LevelWeights => {
    const mat = initialWasteWeightMaternelleG ?? null;
    const prim = initialWasteWeightPrimaireG ?? null;
    if (mat != null || prim != null) {
      return { MATERNELLE: mat, PRIMAIRE: prim };
    }
    return { MATERNELLE: null, PRIMAIRE: null };
  };

  const [saved, setSaved] = useState<LevelWeights>(initialLevels);
  const [matInput, setMatInput] = useState(() =>
    gramsToInput(initialLevels().MATERNELLE),
  );
  const [primInput, setPrimInput] = useState(() =>
    gramsToInput(initialLevels().PRIMAIRE),
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error" | "offline">(
    "idle",
  );
  const [savedAck, setSavedAck] = useState(false);

  const parsedMat = parseGramsInput(matInput);
  const parsedPrim = parseGramsInput(primInput);
  const invalidMat = matInput.trim() !== "" && parsedMat === null;
  const invalidPrim = primInput.trim() !== "" && parsedPrim === null;
  const dirty =
    parsedMat !== saved.MATERNELLE || parsedPrim !== saved.PRIMAIRE;
  const canSave =
    dirty && !invalidMat && !invalidPrim && status !== "saving";

  const totalSaved =
    totalWasteFromLevels(saved.MATERNELLE, saved.PRIMAIRE) ??
    (initialWasteWeightG != null &&
    saved.MATERNELLE == null &&
    saved.PRIMAIRE == null
      ? initialWasteWeightG
      : 0);

  useEffect(() => {
    const queued = getQueuedWaste(serviceId);
    if (queued) {
      const next = {
        MATERNELLE: queued.waste.wasteWeightMaternelleG,
        PRIMAIRE: queued.waste.wasteWeightPrimaireG,
      };
      setSaved(next);
      setMatInput(gramsToInput(next.MATERNELLE));
      setPrimInput(gramsToInput(next.PRIMAIRE));
      setStatus("offline");
      setSavedAck(false);
      return;
    }
    const next = initialLevels();
    setSaved(next);
    setMatInput(gramsToInput(next.MATERNELLE));
    setPrimInput(gramsToInput(next.PRIMAIRE));
    setStatus("idle");
    setSavedAck(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on service / props change
  }, [
    serviceId,
    initialWasteWeightG,
    initialWasteWeightMaternelleG,
    initialWasteWeightPrimaireG,
  ]);

  useEffect(() => {
    if (dirty) setSavedAck(false);
  }, [dirty]);

  const save = useCallback(async () => {
    if (invalidMat || invalidPrim) {
      setStatus("error");
      return false;
    }

    const payload = {
      wasteWeightMaternelleG: parsedMat,
      wasteWeightPrimaireG: parsedPrim,
    };

    if (!online) {
      enqueueWasteSave(serviceId, payload);
      setSaved({ MATERNELLE: parsedMat, PRIMAIRE: parsedPrim });
      setStatus("offline");
      setSavedAck(true);
      return true;
    }

    setStatus("saving");
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        enqueueWasteSave(serviceId, payload);
        setSaved({ MATERNELLE: parsedMat, PRIMAIRE: parsedPrim });
        setStatus("offline");
        setSavedAck(true);
        return false;
      }
      const data = (await res.json()) as {
        service: {
          wasteWeightG: number | null;
          wasteWeightMaternelleG: number | null;
          wasteWeightPrimaireG: number | null;
        };
      };
      const next: LevelWeights = {
        MATERNELLE: data.service.wasteWeightMaternelleG,
        PRIMAIRE: data.service.wasteWeightPrimaireG,
      };
      removeQueuedWaste(serviceId);
      setSaved(next);
      setMatInput(gramsToInput(next.MATERNELLE));
      setPrimInput(gramsToInput(next.PRIMAIRE));
      setStatus("saved");
      setSavedAck(true);
      window.setTimeout(() => setStatus("idle"), 800);
      return true;
    } catch {
      enqueueWasteSave(serviceId, payload);
      setSaved({ MATERNELLE: parsedMat, PRIMAIRE: parsedPrim });
      setStatus("offline");
      setSavedAck(true);
      return false;
    }
  }, [online, serviceId, invalidMat, invalidPrim, parsedMat, parsedPrim]);

  const parsedTotal = totalWasteFromLevels(parsedMat, parsedPrim);

  const statusMessage = invalidMat || invalidPrim ? (
    "Saisissez un nombre de grammes valide"
  ) : status === "offline" ? (
    <>
      <CloudOff className="h-3.5 w-3.5" aria-hidden />
      Hors ligne — saisie gardée sur cet appareil, sync au retour du réseau
    </>
  ) : status === "error" ? (
    "Erreur à l’enregistrement — réessayez"
  ) : dirty ? (
    "Modifications non enregistrées"
  ) : savedAck ? (
    "Vous pouvez modifier et ré-enregistrer si besoin"
  ) : (
    "Appuyez sur Enregistrer après les pesées"
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-300 shadow-md",
        className,
      )}
    >
      <div className="relative overflow-hidden border-b border-white/20 bg-zinc-800 px-4 py-4 text-center sm:px-6 sm:py-5">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[4.5rem] overflow-hidden sm:w-28 md:w-36"
          aria-hidden
        >
          <Trash2
            className="absolute right-0 top-1/2 h-44 w-44 -translate-y-1/2 text-white/25 sm:h-56 sm:w-56 md:h-64 md:w-64"
            strokeWidth={1.25}
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25">
              <Trash2 className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold leading-snug text-white sm:text-xl">
              Poids des déchets
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">
            Après le service — une pesée par cycle (maternelle / primaire)
          </p>
          <div className="mx-auto mt-4 inline-flex min-w-[12rem] flex-col items-center justify-center rounded-2xl border-2 border-white/35 bg-white/10 px-8 py-3 text-white shadow-inner sm:min-w-[14rem] sm:px-10">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Total
            </span>
            <span className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <span>{totalSaved.toLocaleString("fr-FR")} g</span>
              <span className="text-base font-medium text-white/80 sm:text-lg">
                ({formatKgFromGrams(totalSaved)})
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2">
        {(["MATERNELLE", "PRIMAIRE"] as const).map((level) => {
          const value = level === "MATERNELLE" ? matInput : primInput;
          const setValue = level === "MATERNELLE" ? setMatInput : setPrimInput;
          const parsed = level === "MATERNELLE" ? parsedMat : parsedPrim;
          const tone = LEVEL_PANEL[level];
          return (
            <div
              key={level}
              className={cn(
                "relative flex min-h-[14rem] flex-col px-4 pb-6 pt-4 sm:min-h-[16rem] sm:px-6 sm:pt-5",
                tone.shell,
                level === "PRIMAIRE" && "border-t border-white/25 sm:border-l sm:border-t-0",
              )}
            >
              <Label
                htmlFor={`waste-${level}-${serviceId}`}
                className="relative z-10 w-full justify-center text-center text-lg font-bold tracking-wide text-white sm:text-xl"
              >
                {schoolLevelLabelFr(level)} (g)
              </Label>
              <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <Input
                  id={`waste-${level}-${serviceId}`}
                  type="text"
                  inputMode="numeric"
                  placeholder="ex. 4200"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={cn(
                    "h-14 w-full max-w-[14rem] border-2 bg-white/95 text-center text-xl font-semibold text-zinc-900 placeholder:text-base placeholder:font-normal placeholder:text-zinc-500 sm:text-2xl",
                    tone.inputBorder,
                  )}
                />
                <span className="text-sm text-white/90">
                  {parsed != null && parsed > 0
                    ? `= ${formatKgFromGrams(parsed)}`
                    : "Pesée du bac / zone"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-4 sm:px-6">
        {parsedTotal != null ? (
          <span className="text-sm text-zinc-700 sm:text-base">
            Total saisi : {parsedTotal.toLocaleString("fr-FR")} g (
            {formatKgFromGrams(parsedTotal)})
          </span>
        ) : null}

        <div className="flex w-full max-w-xl flex-col items-center justify-center gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            size="lg"
            disabled={!canSave}
            onClick={() => void save()}
            className="h-12 min-w-[11rem] shrink-0 rounded-xl border-2 border-yellow-400 bg-white font-semibold text-zinc-800 shadow-sm ring-2 ring-yellow-300/80 hover:bg-white/95 disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:ring-transparent"
          >
            <Save className="h-4 w-4 shrink-0" aria-hidden />
            {status === "saving" ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {savedAck ? (
            <p
              className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-left text-sm leading-snug text-emerald-900 sm:max-w-xs sm:text-base"
              role="status"
            >
              <ArrowRight
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden
              />
              <span>
                <strong className="font-semibold">
                  {totalSaved.toLocaleString("fr-FR")} g
                </strong>{" "}
                au total — pris en compte dans le bilan et le dashboard Cantine+.
              </span>
            </p>
          ) : null}
        </div>
        <p className="flex items-center justify-center gap-1.5 text-sm text-zinc-600 sm:text-base">
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
