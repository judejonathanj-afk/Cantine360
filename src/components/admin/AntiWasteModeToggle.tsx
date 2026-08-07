"use client";

import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
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
      setMsg("Objectif g / 100 assiettes : nombre valide requis.");
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
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70 shadow-sm"
    >
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Leaf className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-emerald-950 sm:text-lg">
              Activation du mode
            </p>
            <p className="text-sm text-emerald-900/75">
              {enabled
                ? "Activé — vue commission visible ci-dessous"
                : "Désactivé — basculez pour afficher les indicateurs"}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={busy}
          onClick={() => void save(!enabled)}
          className={cn(
            "relative h-10 w-[4.5rem] shrink-0 self-end rounded-full border-2 transition-colors disabled:opacity-60 sm:self-auto",
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
      </div>

      <div className="flex flex-col gap-3 border-t border-emerald-200/80 bg-white/50 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <label
          htmlFor="anti-waste-target"
          className="shrink-0 text-sm font-medium text-emerald-950"
        >
          Objectif (g / 100 assiettes)
        </label>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="anti-waste-target"
            type="text"
            inputMode="decimal"
            placeholder="ex. 80"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-9 max-w-[12rem] border-emerald-200 bg-white"
          />
          <Button
            type="button"
            disabled={busy}
            variant="outline"
            size="sm"
            className="border-emerald-700 text-emerald-900 hover:bg-emerald-100"
            onClick={() => void save(enabled)}
          >
            {busy ? "…" : "Enregistrer l’objectif"}
          </Button>
        </div>
        {msg ? (
          <p
            className={cn(
              "text-sm sm:ml-auto",
              msg.includes("impossible") ||
                msg.includes("valide") ||
                msg.includes("Réseau")
                ? "text-red-700"
                : "text-emerald-800",
            )}
          >
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
