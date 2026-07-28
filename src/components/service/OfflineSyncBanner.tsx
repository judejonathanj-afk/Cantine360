"use client";

import { useCallback, useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import {
  flushMetricsQueue,
  queuedMetricsCount,
} from "@/lib/offlineMetricsQueue";
import {
  flushWasteQueue,
  queuedWasteCount,
} from "@/lib/offlineWasteQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useRouter } from "next/navigation";

export function OfflineSyncBanner() {
  const online = useOnlineStatus();
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(() => {
    setPending(queuedMetricsCount() + queuedWasteCount());
  }, []);

  useEffect(() => {
    refreshPending();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "c360_metrics_queue" || e.key === "c360_waste_queue") {
        refreshPending();
      }
    };
    const onLocalQueue = () => refreshPending();
    window.addEventListener("storage", onStorage);
    window.addEventListener("c360-offline-queue", onLocalQueue);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("c360-offline-queue", onLocalQueue);
    };
  }, [refreshPending]);

  const sync = useCallback(async () => {
    if (!online || syncing) return;
    setSyncing(true);
    try {
      await Promise.all([flushMetricsQueue(), flushWasteQueue()]);
      refreshPending();
      router.refresh();
    } finally {
      setSyncing(false);
    }
  }, [online, syncing, refreshPending, router]);

  useEffect(() => {
    if (!online) return;
    if (queuedMetricsCount() + queuedWasteCount() === 0) return;
    void sync();
    // Resync when connectivity returns.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  if (online && pending === 0) return null;

  return (
    <div
      role="status"
      className={[
        "border-b px-4 py-2 text-sm",
        online
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-zinc-300 bg-zinc-100 text-zinc-800",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
          {!online ? (
            <span>
              <strong className="font-semibold">Hors ligne</strong> — compteurs et
              déchets sont gardés sur cet appareil et synchronisés au retour du réseau.
            </span>
          ) : (
            <span>
              <strong className="font-semibold">{pending}</strong> saisie
              {pending > 1 ? "s" : ""} en attente de synchronisation.
            </span>
          )}
        </div>
        {online && pending > 0 ? (
          <button
            type="button"
            onClick={() => void sync()}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-950 disabled:opacity-60"
          >
            <RefreshCw
              className={["h-3.5 w-3.5", syncing ? "animate-spin" : ""].join(" ")}
            />
            {syncing ? "Sync…" : "Synchroniser"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
