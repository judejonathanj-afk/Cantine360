"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Baby,
  ChevronDown,
  CloudOff,
  GraduationCap,
  Save,
  Scale,
  Trash2,
} from "lucide-react";
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
import { useQueuedMetrics } from "@/hooks/useQueuedMetrics";
import { overlayQueuedCounts } from "@/lib/mergeQueuedMetrics";
import { buildEndOfServiceBilanTips } from "@/lib/antiWasteEndOfServiceBilan";
import { AntiWasteEndOfServiceBilan } from "@/components/service/AntiWasteEndOfServiceBilan";
import { WASTE_SAVED_EVENT } from "@/components/service/ServiceAntiWasteInsightPanel";
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
  { shell: string; icon: typeof Baby; iconWrap: string }
> = {
  MATERNELLE: {
    shell: "bg-emerald-50",
    icon: Baby,
    iconWrap: "bg-emerald-600 text-white",
  },
  PRIMAIRE: {
    shell: "bg-sky-50",
    icon: GraduationCap,
    iconWrap: "bg-sky-600 text-white",
  },
};

export function ServiceWasteWeightPanel({
  serviceId,
  initialWasteWeightG,
  initialWasteWeightMaternelleG,
  initialWasteWeightPrimaireG,
  antiWasteModeEnabled = false,
  servedCount = 0,
  rabCount = 0,
  refusedCount = 0,
  classCounts,
  targetGPer100 = null,
  mainLabels = [],
  allLabels = [],
  className,
}: {
  serviceId: string;
  initialWasteWeightG: number | null;
  initialWasteWeightMaternelleG?: number | null;
  initialWasteWeightPrimaireG?: number | null;
  antiWasteModeEnabled?: boolean;
  servedCount?: number;
  rabCount?: number;
  refusedCount?: number;
  classCounts?: Array<{
    groupId: string;
    level: "MATERNELLE" | "PRIMAIRE";
    presentCount: number;
    servedCount: number;
    rabCount: number;
    refusedCount: number;
  }>;
  targetGPer100?: number | null;
  mainLabels?: string[];
  allLabels?: string[];
  className?: string;
}) {
  const online = useOnlineStatus();
  const queued = useQueuedMetrics(serviceId);
  const liveTotals = useMemo(() => {
    if (!classCounts || classCounts.length === 0) {
      return { servedCount, rabCount, refusedCount };
    }
    const rows = overlayQueuedCounts(classCounts, queued);
    return {
      servedCount: rows.reduce((sum, row) => sum + row.servedCount, 0),
      rabCount: rows.reduce((sum, row) => sum + row.rabCount, 0),
      refusedCount: rows.reduce((sum, row) => sum + row.refusedCount, 0),
    };
  }, [classCounts, queued, servedCount, rabCount, refusedCount]);
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
  const [panelOpen, setPanelOpen] = useState(false);

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
      setPanelOpen(false);
      window.dispatchEvent(
        new CustomEvent(WASTE_SAVED_EVENT, { detail: { serviceId } }),
      );
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
        setPanelOpen(false);
        window.dispatchEvent(
          new CustomEvent(WASTE_SAVED_EVENT, { detail: { serviceId } }),
        );
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
      setPanelOpen(false);
      window.dispatchEvent(
        new CustomEvent(WASTE_SAVED_EVENT, { detail: { serviceId } }),
      );
      window.setTimeout(() => setStatus("idle"), 800);
      return true;
    } catch {
      enqueueWasteSave(serviceId, payload);
      setSaved({ MATERNELLE: parsedMat, PRIMAIRE: parsedPrim });
      setStatus("offline");
      setSavedAck(true);
      setPanelOpen(false);
      window.dispatchEvent(
        new CustomEvent(WASTE_SAVED_EVENT, { detail: { serviceId } }),
      );
      return false;
    }
  }, [online, serviceId, invalidMat, invalidPrim, parsedMat, parsedPrim]);

  const parsedTotal = totalWasteFromLevels(parsedMat, parsedPrim);

  const bilanTips =
    antiWasteModeEnabled && savedAck && totalSaved > 0
      ? buildEndOfServiceBilanTips({
          wasteWeightG: totalSaved,
          served: liveTotals.servedCount,
          rab: liveTotals.rabCount,
          refused: liveTotals.refusedCount,
          targetGPer100,
          mainLabels,
          allLabels,
        })
      : [];

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

  const shownTotal = parsedTotal ?? totalSaved;

  const closedSummary =
    shownTotal > 0
      ? `${shownTotal.toLocaleString("fr-FR")} g (${formatKgFromGrams(shownTotal)}) · maternelle / primaire`
      : "Après le service — appuyez pour afficher la pesée";

  return (
    <div className={cn("mx-auto max-w-6xl space-y-4 px-1 sm:space-y-6 sm:px-2", className)}>
      <section className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_14px_40px_rgba(24,24,27,0.08)] transition-[transform,box-shadow] duration-200 ease-out hover:z-10 hover:scale-[1.015] hover:shadow-[0_22px_52px_rgba(24,24,27,0.14)] motion-reduce:transition-none motion-reduce:hover:scale-100">
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-zinc-50/80 sm:px-5 sm:py-5"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d2ff5a] text-zinc-900 sm:h-11 sm:w-11"
            aria-hidden
          >
            <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
              Fin de service
            </span>
            <span className="block text-base font-extrabold tracking-tight text-zinc-900 sm:text-lg">
              {panelOpen ? "Masquer le poids des déchets" : "Ouvrir le poids des déchets"}
            </span>
            {!panelOpen ? (
              <span className="mt-0.5 block text-sm text-zinc-500">{closedSummary}</span>
            ) : null}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200",
              panelOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </section>

      {panelOpen ? (
        <div className="space-y-4 rounded-[24px] border border-zinc-200/80 bg-[#eef4ef] p-4 shadow-[0_10px_32px_rgba(24,24,27,0.06)] sm:p-5">
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 shadow-md">
      <div className="flex items-center gap-3 bg-[#1e2a3a] px-4 py-4 text-white sm:px-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
          <Trash2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight sm:text-xl">Poids des déchets</h2>
          <p className="mt-0.5 text-sm text-white/75">
            Après le service — une pesée par cycle (maternelle / primaire)
          </p>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-3 rounded-xl border border-zinc-300/80 bg-white px-4 py-3.5 text-zinc-950 shadow-sm">
          <Scale className="h-5 w-5 text-zinc-700" aria-hidden />
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-700">
              Total
            </p>
            <p className="text-2xl font-extrabold leading-none text-zinc-950 sm:text-3xl">
              {shownTotal.toLocaleString("fr-FR")} g{" "}
              <span className="text-base font-semibold text-zinc-700 sm:text-lg">
                ({formatKgFromGrams(shownTotal)})
              </span>
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {(["MATERNELLE", "PRIMAIRE"] as const).map((level) => {
            const value = level === "MATERNELLE" ? matInput : primInput;
            const setValue = level === "MATERNELLE" ? setMatInput : setPrimInput;
            const parsed = level === "MATERNELLE" ? parsedMat : parsedPrim;
            const tone = LEVEL_PANEL[level];
            const Icon = tone.icon;
            return (
              <div
                key={level}
                className={cn(
                  "rounded-xl border border-zinc-900/10 px-4 py-4 shadow-sm",
                  tone.shell,
                )}
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      tone.iconWrap,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <Label
                    htmlFor={`waste-${level}-${serviceId}`}
                    className="text-base font-extrabold text-zinc-950 sm:text-lg"
                  >
                    {schoolLevelLabelFr(level)} (g)
                  </Label>
                </div>
                <Input
                  id={`waste-${level}-${serviceId}`}
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex. 4200"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-12 border-2 border-zinc-300 bg-white text-center text-lg font-bold text-zinc-950 shadow-sm placeholder:text-zinc-400"
                />
                <p className="mt-2 text-center text-sm font-semibold text-zinc-800">
                  {parsed != null && parsed > 0
                    ? `= ${formatKgFromGrams(parsed)}`
                    : "Pesée du bac / zone"}
                </p>
              </div>
            );
          })}
        </div>

        <p className="flex items-center justify-center gap-1.5 pb-1 text-center text-sm font-semibold text-zinc-800">
          {statusMessage}
        </p>
      </div>
    </div>

    <div className="flex flex-col items-center gap-2">
      {savedAck && !dirty ? (
        <p className="text-center text-base font-bold text-emerald-800" role="status">
          Déchets enregistrés
        </p>
      ) : null}
      <Button
        type="button"
        disabled={!canSave}
        onClick={() => void save()}
        className={cn(
          "h-11 w-full max-w-md rounded-xl px-6 text-base font-semibold shadow-sm sm:min-w-[14rem]",
          canSave
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-zinc-200 text-zinc-500 hover:bg-zinc-200 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:opacity-100",
        )}
      >
        <Save className="h-4 w-4 shrink-0" aria-hidden />
        {status === "saving" ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>

    {bilanTips.length > 0 ? (
      <AntiWasteEndOfServiceBilan tips={bilanTips} />
    ) : null}
        </div>
      ) : null}

    </div>
  );
}
