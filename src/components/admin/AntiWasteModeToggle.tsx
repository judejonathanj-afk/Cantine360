"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TARGET_MAX = 5000;

export function AntiWasteModeToggle({
  initialEnabled,
  initialTargetGPer100,
  schemaReady = true,
}: {
  initialEnabled: boolean;
  initialTargetGPer100: number | null;
  schemaReady?: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [target, setTarget] = useState(
    initialTargetGPer100 != null ? String(initialTargetGPer100) : "",
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const savingRef = useRef(false);
  /** Évite qu’un refresh RSC périmé écrase un état déjà confirmé en base. */
  const pendingServerEnabled = useRef<boolean | null>(null);

  useEffect(() => {
    if (
      pendingServerEnabled.current != null &&
      initialEnabled !== pendingServerEnabled.current
    ) {
      // Props encore stale après le PATCH — on garde l’état confirmé.
      return;
    }
    pendingServerEnabled.current = null;
    setEnabled(initialEnabled);
    setTarget(
      initialTargetGPer100 != null ? String(initialTargetGPer100) : "",
    );
  }, [initialEnabled, initialTargetGPer100]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#anti-waste") return;
    document.getElementById("anti-waste")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  async function save(nextEnabled: boolean) {
    if (savingRef.current || busy) return;
    if (!schemaReady) {
      setMsg(
        "Base non à jour — exécutez npm run prisma:deploy avant d’activer le mode.",
      );
      return;
    }
    savingRef.current = true;
    setBusy(true);
    setMsg(null);
    const trimmed = target.trim().replace(",", ".");
    const parsedTarget = trimmed === "" ? null : Number(trimmed);
    if (
      parsedTarget != null &&
      (!Number.isFinite(parsedTarget) ||
        parsedTarget < 0 ||
        parsedTarget > TARGET_MAX)
    ) {
      setMsg(`Objectif : nombre entre 0 et ${TARGET_MAX} (ex. 80).`);
      savingRef.current = false;
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
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        antiWasteModeEnabled?: boolean;
        antiWasteTargetGPer100?: number | null;
      };
      if (!res.ok) {
        setMsg(data.error ?? "Enregistrement impossible.");
        return;
      }
      const confirmedEnabled =
        typeof data.antiWasteModeEnabled === "boolean"
          ? data.antiWasteModeEnabled
          : nextEnabled;
      pendingServerEnabled.current = confirmedEnabled;
      setEnabled(confirmedEnabled);
      if (data.antiWasteTargetGPer100 !== undefined) {
        setTarget(
          data.antiWasteTargetGPer100 != null
            ? String(data.antiWasteTargetGPer100)
            : "",
        );
      }
      setMsg(
        confirmedEnabled
          ? "Mode activé pour cet établissement — reste actif jusqu’à désactivation."
          : "Mode désactivé pour cet établissement.",
      );
      router.refresh();
    } catch {
      setMsg("Réseau indisponible.");
    } finally {
      savingRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div
      id="anti-waste"
      className="scroll-mt-24 overflow-hidden rounded-2xl border-2 border-sky-400 bg-sky-600 shadow-md"
    >
      {!schemaReady ? (
        <p className="border-b border-amber-300/40 bg-amber-500/90 px-4 py-2.5 text-sm font-semibold text-amber-950 sm:px-6">
          Colonnes Anti-gaspillage absentes de la base — déployez la migration (
          <code className="rounded bg-amber-100 px-1">npm run prisma:deploy</code>
          ) avant d’activer le mode.
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-4">
        <div className="min-w-0 flex-1 text-left">
          <p className="text-base font-bold text-white sm:text-lg">
            Activation du mode anti-gaspillage
          </p>
          <p className="text-sm text-white/75">
            {enabled
              ? "Activé pour cet établissement — reste actif jusqu’à désactivation manuelle"
              : "Désactivé — basculez pour afficher les indicateurs"}
          </p>
          <p className="mt-1 text-xs text-white/60">
            Réglage indépendant : n’affecte pas les autres établissements /
            comptes.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ArrowRight
            className="hidden h-6 w-6 text-white/80 sm:block"
            aria-hidden
          />
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={busy || !schemaReady}
            onClick={() => void save(!enabled)}
            className={cn(
              "relative h-10 w-[4.5rem] shrink-0 rounded-full border-2 transition-colors disabled:opacity-60",
              enabled
                ? "border-emerald-300 bg-emerald-500"
                : "border-white/40 bg-white/20",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-8 w-8 rounded-full bg-white shadow transition-transform",
                enabled ? "left-8" : "left-0.5",
              )}
            />
            <span className="sr-only">
              {enabled ? "Désactiver" : "Activer"} le mode Anti-gaspillage
            </span>
          </button>
        </div>
      </div>

      {msg ? (
        <p
          className={cn(
            "border-t border-white/15 px-4 py-2.5 text-sm sm:px-6",
            msg.includes("impossible") ||
              msg.includes("valide") ||
              msg.includes("Réseau") ||
              msg.includes("Base") ||
              msg.includes("colonnes") ||
              msg.includes("introuvable") ||
              msg.includes("Déployez") ||
              msg.includes("prisma")
              ? "bg-black/20 text-red-300"
              : "bg-black/20 text-emerald-200",
          )}
        >
          {msg}
        </p>
      ) : null}

      {enabled ? (
        <div className="space-y-3 border-t border-white/15 bg-black/15 px-4 py-4 sm:px-6">
          <div>
            <label
              htmlFor="anti-waste-target"
              className="text-sm font-bold text-white sm:text-base"
            >
              Objectif de déchets à ne pas dépasser
            </label>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/80">
              Indiquez combien de grammes de déchets vous acceptez{" "}
              <strong className="font-semibold text-white">
                pour 100 assiettes servies
              </strong>
              . Exemple : <strong className="font-semibold text-white">80</strong>{" "}
              signifie « pas plus de 80 g jetés pour 100 repas » (soit 0,8 kg). Ce
              seuil colore ensuite le suivi en vert, orange ou rouge.
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
                disabled={busy || !schemaReady}
                onChange={(e) => setTarget(e.target.value)}
                className="h-10 w-28 border-sky-300 bg-white text-base tabular-nums text-sky-900"
                aria-describedby="anti-waste-target-hint"
              />
              <span
                id="anti-waste-target-hint"
                className="text-sm font-medium text-white/80"
              >
                g / 100 assiettes
              </span>
            </div>
            <Button
              type="button"
              disabled={busy || !schemaReady}
              variant="outline"
              size="sm"
              className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={() => void save(enabled)}
            >
              {busy ? "…" : "Enregistrer l’objectif"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
