"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AntiWasteModeToggle({
  initialEnabled,
  initialTargetGPer100,
}: {
  initialEnabled: boolean;
  initialTargetGPer100: number | null;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [target, setTarget] = useState(
    initialTargetGPer100 != null ? String(initialTargetGPer100) : "",
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
          ? "Mode Antigaspillage activé — le bouton apparaît dans la navigation."
          : "Mode Antigaspillage désactivé.",
      );
      router.refresh();
    } catch {
      setMsg("Réseau indisponible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-800/80 bg-emerald-50/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-base font-semibold text-emerald-950 sm:text-lg">
            <Leaf className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
            Mode Antigaspillage
          </div>
          <p className="mt-1 text-sm leading-relaxed text-emerald-950/80 sm:text-base">
            Réservé à l’admin : activez ce mode pour afficher le bouton{" "}
            <strong className="font-semibold">Antigaspillage</strong> (cuisine et admin) —
            vue dédiée déchets, g/100 assiettes et objectif.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={busy}
          onClick={() => void save(!enabled)}
          className={cn(
            "relative h-9 w-16 shrink-0 rounded-full transition-colors disabled:opacity-60",
            enabled ? "bg-emerald-600" : "bg-zinc-300",
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-transform",
              enabled ? "left-8" : "left-1",
            )}
          />
          <span className="sr-only">
            {enabled ? "Désactiver" : "Activer"} le mode Antigaspillage
          </span>
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="anti-waste-target" className="text-emerald-950">
            Objectif (g / 100 assiettes)
          </Label>
          <Input
            id="anti-waste-target"
            type="text"
            inputMode="decimal"
            placeholder="ex. 80"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border-emerald-200 bg-white"
          />
        </div>
        <Button
          type="button"
          disabled={busy}
          variant="outline"
          className="border-emerald-700 text-emerald-900 hover:bg-emerald-100"
          onClick={() => void save(enabled)}
        >
          {busy ? "…" : "Enregistrer l’objectif"}
        </Button>
      </div>

      {msg ? (
        <p
          className={cn(
            "mt-3 text-sm",
            msg.includes("impossible") || msg.includes("valide") || msg.includes("Réseau")
              ? "text-red-700"
              : "text-emerald-900",
          )}
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
