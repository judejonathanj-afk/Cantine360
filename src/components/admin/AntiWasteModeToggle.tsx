"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const TARGET_MAX = 5000;

export function AntiWasteModeToggle({
  initialEnabled,
  initialTargetGPer100,
  schemaReady = true,
  compact = false,
}: {
  initialEnabled: boolean;
  initialTargetGPer100: number | null;
  schemaReady?: boolean;
  /** Sans carte externe (déjà dans la grille hero). */
  compact?: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [target, setTarget] = useState(
    initialTargetGPer100 != null ? String(initialTargetGPer100) : "",
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const savingRef = useRef(false);
  const pendingServerEnabled = useRef<boolean | null>(null);

  useEffect(() => {
    if (
      pendingServerEnabled.current != null &&
      initialEnabled !== pendingServerEnabled.current
    ) {
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

  const body = (
    <>
      {!schemaReady ? (
        <p className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950">
          Colonnes Anti-gaspillage absentes — déployez{" "}
          <code className="rounded bg-amber-100 px-1">npm run prisma:deploy</code>
          .
        </p>
      ) : null}

      <div
        className="flex items-start justify-between gap-4 rounded-2xl p-5 text-zinc-950"
        style={{ backgroundColor: "#B9F2D0" }}
      >
        <div>
          <p className="font-display text-base font-semibold text-zinc-950">
            Activation du mode
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-900/85">
            {enabled
              ? "Activé pour cet établissement — reste actif jusqu’à désactivation manuelle."
              : "Désactivé. Activez pour suivre le gaspillage de cet établissement."}
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-900/75">
            Réglage indépendant : n’affecte pas les autres établissements.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Activation du mode anti-gaspillage"
          disabled={busy || !schemaReady}
          onClick={() => void save(!enabled)}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60",
            enabled ? "bg-primary" : "bg-zinc-900/25",
          )}
        >
          <span
            className={cn(
              "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all",
              enabled ? "left-6" : "left-1",
            )}
          />
        </button>
      </div>

      {msg ? (
        <p
          className={cn(
            "text-sm",
            msg.includes("impossible") ||
              msg.includes("valide") ||
              msg.includes("Réseau") ||
              msg.includes("Base") ||
              msg.includes("colonnes") ||
              msg.includes("introuvable") ||
              msg.includes("Déployez") ||
              msg.includes("prisma")
              ? "text-rose-300"
              : "text-emerald-300",
          )}
        >
          {msg}
        </p>
      ) : null}

      {enabled ? (
        <div
          className="rounded-2xl border border-emerald-900/15 p-5 text-zinc-950"
          style={{ backgroundColor: "#B9F2D0" }}
        >
          <div className="flex items-center gap-2">
            <Target className="size-4 text-emerald-800" aria-hidden />
            <p className="font-display text-base font-semibold text-zinc-950">
              Objectif à ne pas dépasser
            </p>
          </div>
          <p className="mt-1 text-sm leading-relaxed font-medium text-zinc-900/85">
            Grammes de déchets acceptés{" "}
            <span className="font-semibold text-zinc-950">
              pour 100 assiettes servies
            </span>
            . Ex. <span className="font-semibold text-zinc-950">80</span> = pas
            plus de 0,8 kg jetés pour 100 repas.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-900/20 bg-white/70 px-3 py-2 focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/25">
              <input
                id="anti-waste-target"
                inputMode="decimal"
                value={target}
                disabled={busy || !schemaReady}
                onChange={(e) => setTarget(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    void save(enabled);
                  }
                }}
                placeholder="ex. 80"
                className="w-20 bg-transparent text-lg font-semibold text-zinc-950 outline-none placeholder:font-normal placeholder:text-zinc-500"
                aria-label="Objectif en grammes pour 100 assiettes"
              />
              <span className="text-sm text-zinc-700">g / 100</span>
            </div>
            <button
              type="button"
              disabled={busy || !schemaReady}
              onClick={() => void save(enabled)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
            >
              {busy ? "…" : "Enregistrer"}
              <ArrowRight className="size-4" aria-hidden />
            </button>
            {initialTargetGPer100 != null || target.trim() !== "" ? (
              <button
                type="button"
                disabled={busy || !schemaReady}
                onClick={() => {
                  setTarget("");
                  void (async () => {
                    if (savingRef.current || busy) return;
                    savingRef.current = true;
                    setBusy(true);
                    setMsg(null);
                    try {
                      const res = await fetch("/api/establishment/anti-waste", {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          antiWasteModeEnabled: enabled,
                          antiWasteTargetGPer100: null,
                        }),
                      });
                      const data = (await res.json().catch(() => ({}))) as {
                        error?: string;
                      };
                      if (!res.ok) {
                        setMsg(data.error ?? "Enregistrement impossible.");
                        return;
                      }
                      setTarget("");
                      setMsg("Objectif effacé.");
                      router.refresh();
                    } catch {
                      setMsg("Réseau indisponible.");
                    } finally {
                      savingRef.current = false;
                      setBusy(false);
                    }
                  })();
                }}
                className="text-sm font-medium text-zinc-800 underline-offset-4 hover:underline"
              >
                Effacer
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <div
        id="anti-waste"
        className="flex scroll-mt-24 flex-col gap-5 rounded-3xl bg-black p-5 sm:p-6"
      >
        {body}
      </div>
    );
  }

  return (
    <div
      id="anti-waste"
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/10 bg-black p-6 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.55)] sm:p-8"
    >
      <div className="flex flex-col gap-5">{body}</div>
    </div>
  );
}
