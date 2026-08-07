"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AntiWasteModeToggle({
  initialEnabled,
  initialTargetGPer100,
}: {
  initialEnabled: boolean;
  initialTargetGPer100: number | null;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [target, setTarget] = useState(
    initialTargetGPer100 != null ? String(initialTargetGPer100) : "",
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#anti-waste") return;
    document.getElementById("anti-waste")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  async function save(nextEnabled: boolean) {
    setBusy(true);
    setMsg(null);
    const trimmed = target.trim().replace(",", ".");
    const parsedTarget = trimmed === "" ? null : Number(trimmed);
    if (parsedTarget != null && (!Number.isFinite(parsedTarget) || parsedTarget < 0)) {
      setMsg("Objectif : entrez un nombre valide (ex. 80).");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/establishment/anti-waste", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          antiWasteModeEnabled: nextEnabled,
          antiWasteTargetGPer100: parsedTarget,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "Enregistrement impossible.");
        return;
      }
      setEnabled(nextEnabled);
      setMsg(
        nextEnabled
          ? "Mode activé — affichage de la vue…"
          : "Mode désactivé.",
      );
      window.setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      setMsg("Réseau indisponible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      id="anti-waste"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-amber-300 bg-amber-100 shadow-sm"
    >
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={busy}
            onClick={() => void save(!enabled)}
            className={cn(
              "relative h-10 w-[4.5rem] shrink-0 rounded-full border-2 transition-colors disabled:opacity-60",
              enabled
                ? "border-emerald-800 bg-emerald-600"
                : "border-zinc-400 bg-zinc-200",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-8 w-8 rounded-full bg-white shadow transition-transform",
                enabled ? "left-8" : "left-0.5",
              )}
            />
            <span className="sr-only">
              {enabled ? "Désactiver" : "Activer"} le mode Antigaspillage
            </span>
          </button>
          <div className="min-w-0">
            <p className="text-base font-bold text-amber-950 sm:text-lg">
              Activation du mode
            </p>
            <p className="text-sm text-amber-950/75">
              {enabled
                ? "Activé — vue commission visible ci-dessous"
                : "Désactivé — basculez pour afficher les indicateurs"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-amber-300/80 bg-amber-50/80 px-4 py-4 sm:px-6">
        <div>
          <label
            htmlFor="anti-waste-target"
            className="text-sm font-bold text-amber-950 sm:text-base"
          >
            Objectif de déchets à ne pas dépasser
          </label>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-amber-950/80">
            Indiquez combien de grammes de déchets vous acceptez{" "}
            <strong className="font-semibold">pour 100 assiettes servies</strong>
            . Exemple : <strong className="font-semibold">80</strong> signifie
            « pas plus de 80 g jetés pour 100 repas » (soit 0,8 kg). Ce seuil
            colore ensuite le suivi en vert, orange ou rouge.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Input
              id="anti-waste-target"
              type="text"
              inputMode="decimal"
              placeholder="ex. 80"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-10 w-28 border-amber-300 bg-white text-base tabular-nums"
              aria-describedby="anti-waste-target-hint"
            />
            <span
              id="anti-waste-target-hint"
              className="text-sm font-medium text-amber-950/80"
            >
              g / 100 assiettes
            </span>
          </div>
          <Button
            type="button"
            disabled={busy}
            variant="outline"
            size="sm"
            className="border-amber-700 text-amber-950 hover:bg-amber-200"
            onClick={() => void save(enabled)}
          >
            {busy ? "…" : "Enregistrer l’objectif"}
          </Button>
          {msg ? (
            <p
              className={cn(
                "text-sm",
                msg.includes("impossible") ||
                  msg.includes("valide") ||
                  msg.includes("Réseau")
                  ? "text-red-700"
                  : "text-amber-900",
              )}
            >
              {msg}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
