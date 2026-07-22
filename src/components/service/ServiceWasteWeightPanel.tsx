"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CloudOff, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SERVICE_INSIGHT_TONES } from "@/components/service/serviceInsightTones";
import { formatKgFromGrams } from "@/lib/serviceGrammage";
import { totalWasteFromLevels } from "@/lib/serviceWasteByLevel";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
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

const LEVEL_INPUT_STYLE: Record<SchoolLevel, string> = {
  MATERNELLE: "border-sky-300 focus-visible:ring-sky-400",
  PRIMAIRE: "border-emerald-300 focus-visible:ring-emerald-400",
};

const LEVEL_LABEL_STYLE: Record<SchoolLevel, string> = {
  MATERNELLE: "text-sky-100",
  PRIMAIRE: "text-emerald-100",
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
    // Legacy: un seul total — préremplir les deux vides (cuisine saisit par cycle)
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
    dirty && !invalidMat && !invalidPrim && online && status !== "saving";

  const totalSaved =
    totalWasteFromLevels(saved.MATERNELLE, saved.PRIMAIRE) ??
    (initialWasteWeightG != null &&
    saved.MATERNELLE == null &&
    saved.PRIMAIRE == null
      ? initialWasteWeightG
      : 0);

  useEffect(() => {
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
    if (!online) {
      setStatus("offline");
      return false;
    }
    if (invalidMat || invalidPrim) {
      setStatus("error");
      return false;
    }

    setStatus("saving");
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wasteWeightMaternelleG: parsedMat,
          wasteWeightPrimaireG: parsedPrim,
        }),
      });
      if (!res.ok) {
        setStatus("error");
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
      setSaved(next);
      setMatInput(gramsToInput(next.MATERNELLE));
      setPrimInput(gramsToInput(next.PRIMAIRE));
      setStatus("saved");
      setSavedAck(true);
      window.setTimeout(() => setStatus("idle"), 800);
      return true;
    } catch {
      setStatus("offline");
      return false;
    }
  }, [online, serviceId, invalidMat, invalidPrim, parsedMat, parsedPrim]);

  const t = SERVICE_INSIGHT_TONES.emerald;
  const parsedTotal = totalWasteFromLevels(parsedMat, parsedPrim);

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

      <div className="relative z-10 flex min-h-[18rem] flex-col items-center justify-center px-4 py-5 sm:min-h-[20rem] sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 text-center">
          <div className="w-full rounded-2xl border border-white/35 bg-white/10 px-4 py-3.5 shadow-inner sm:px-5 sm:py-4">
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
                Poids des déchets
              </h2>
            </div>
            <p className={cn("mt-2 text-sm leading-relaxed sm:text-base", t.muted)}>
              Après le service — une pesée par cycle (maternelle / primaire)
            </p>
          </div>

          <div
            className={cn(
              "inline-flex min-w-[12rem] flex-col items-center justify-center rounded-2xl border-2 border-white/40 bg-white/10 px-8 py-3 shadow-inner sm:min-w-[14rem] sm:px-10 sm:py-3.5",
              t.text,
            )}
          >
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

          <div className="grid w-full gap-4 sm:grid-cols-2">
            {(["MATERNELLE", "PRIMAIRE"] as const).map((level) => {
              const value = level === "MATERNELLE" ? matInput : primInput;
              const setValue = level === "MATERNELLE" ? setMatInput : setPrimInput;
              const parsed = level === "MATERNELLE" ? parsedMat : parsedPrim;
              return (
                <div key={level} className="flex flex-col items-center gap-2">
                  <Label
                    htmlFor={`waste-${level}-${serviceId}`}
                    className={cn(
                      "text-base font-semibold sm:text-lg",
                      LEVEL_LABEL_STYLE[level],
                    )}
                  >
                    {schoolLevelLabelFr(level)} (g)
                  </Label>
                  <Input
                    id={`waste-${level}-${serviceId}`}
                    type="text"
                    inputMode="numeric"
                    placeholder="ex. 4200"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className={cn(
                      "h-14 w-full max-w-[12rem] border-2 bg-white/95 text-center text-xl font-semibold text-zinc-900 placeholder:text-base placeholder:font-normal placeholder:text-zinc-500 sm:text-2xl",
                      LEVEL_INPUT_STYLE[level],
                    )}
                  />
                  <span className="text-sm text-white/85">
                    {parsed != null && parsed > 0
                      ? `= ${formatKgFromGrams(parsed)}`
                      : "Pesée du bac / zone"}
                  </span>
                </div>
              );
            })}
          </div>

          {parsedTotal != null ? (
            <span className="text-sm text-white/90 sm:text-base">
              Total saisi : {parsedTotal.toLocaleString("fr-FR")} g (
              {formatKgFromGrams(parsedTotal)})
            </span>
          ) : null}

          <div className="flex w-full max-w-xl flex-col items-center justify-center gap-3 pt-1 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="lg"
              disabled={!canSave}
              onClick={() => void save()}
              className="h-12 min-w-[11rem] shrink-0 rounded-xl border-2 border-yellow-400 bg-white font-semibold text-emerald-800 shadow-sm ring-2 ring-yellow-300/80 hover:bg-white/95 disabled:border-white/25 disabled:bg-white/40 disabled:text-emerald-900/40 disabled:ring-transparent"
            >
              <Save className="h-4 w-4 shrink-0" aria-hidden />
              {status === "saving" ? "Enregistrement…" : "Enregistrer"}
            </Button>
            {savedAck ? (
              <p
                className="flex items-start gap-2 rounded-xl border border-lime-300/50 bg-white/15 px-3.5 py-2.5 text-left text-sm leading-snug text-white sm:max-w-xs sm:text-base"
                role="status"
              >
                <ArrowRight
                  className="mt-0.5 h-5 w-5 shrink-0 text-lime-300"
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
          <p className="flex items-center justify-center gap-1.5 text-sm text-white/80 sm:text-base">
            {invalidMat || invalidPrim ? (
              "Saisissez un nombre de grammes valide"
            ) : status === "offline" ? (
              <>
                <CloudOff className="h-3.5 w-3.5" aria-hidden />
                Hors ligne — réessayez quand la connexion revient
              </>
            ) : status === "error" ? (
              "Erreur à l’enregistrement — réessayez"
            ) : dirty ? (
              "Modifications non enregistrées"
            ) : savedAck ? (
              "Vous pouvez modifier et ré-enregistrer si besoin"
            ) : (
              "Appuyez sur Enregistrer après les pesées"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
