"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CloudOff } from "lucide-react";
import { Counter } from "@/components/Counter";
import { GroupNameBadge } from "@/components/GroupNameBadge";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  enqueueMetricsSave,
  getQueuedMetrics,
  removeQueuedMetrics,
} from "@/lib/offlineMetricsQueue";

type Metrics = {
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
  leftoversCount: number;
};

export function GroupMetricsEditor({
  serviceId,
  groupId,
  groupName,
  schoolName,
  className,
  mealType,
  dateLabel,
  initial,
}: {
  serviceId: string;
  groupId: string;
  groupName: string;
  schoolName?: string;
  className?: string;
  mealType: string;
  dateLabel: string;
  initial: Metrics;
}) {
  const router = useRouter();
  const online = useOnlineStatus();
  const [m, setM] = useState<Metrics>(initial);
  const [lastSaved, setLastSaved] = useState<Metrics>(initial);
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error" | "offline"
  >("idle");
  const [leaving, setLeaving] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const queued = getQueuedMetrics(serviceId, groupId);
    if (!queued) return;
    setM(queued.metrics);
    setLastSaved(queued.metrics);
    setStatus("offline");
  }, [serviceId, groupId]);

  const dirty = useMemo(() => {
    return (
      lastSaved.presentCount !== m.presentCount ||
      lastSaved.servedCount !== m.servedCount ||
      lastSaved.rabCount !== m.rabCount ||
      lastSaved.refusedCount !== m.refusedCount ||
      lastSaved.leftoversCount !== m.leftoversCount
    );
  }, [lastSaved, m]);

  const save = useCallback(
    async (next: Metrics) => {
      if (!online) {
        enqueueMetricsSave(serviceId, groupId, next);
        setLastSaved(next);
        setStatus("offline");
        return true;
      }

      setStatus("saving");
      try {
        const res = await fetch(`/api/services/${serviceId}/metrics`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ groupId, ...next }),
        });
        if (!res.ok) {
          enqueueMetricsSave(serviceId, groupId, next);
          setLastSaved(next);
          setStatus("offline");
          return false;
        }
        removeQueuedMetrics(serviceId, groupId);
        setLastSaved(next);
        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 800);
        return true;
      } catch {
        enqueueMetricsSave(serviceId, groupId, next);
        setLastSaved(next);
        setStatus("offline");
        return false;
      }
    },
    [groupId, online, serviceId],
  );

  useEffect(() => {
    if (!dirty) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void save(m);
    }, 400);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [dirty, m, save]);

  async function saveAndLeave() {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setLeaving(true);
    try {
      if (!online) {
        if (dirty) await save(m);
        setStatus("offline");
        router.back();
        return;
      }

      if (dirty || getQueuedMetrics(serviceId, groupId)) {
        const ok = await save(m);
        if (!ok) {
          setStatus("offline");
          return;
        }
      }

      router.push(`/service/${serviceId}`);
    } finally {
      setLeaving(false);
    }
  }

  const saveLabel =
    leaving || status === "saving"
      ? "Enregistrement…"
      : !online
        ? dirty
          ? "Enregistrer localement"
          : "Enregistré (local)"
        : status === "saved" && !dirty && !leaving
          ? "Enregistré"
          : "Enregistrer";

  return (
    <div className="space-y-6">
      <div className="relative px-2">
        <Button
          type="button"
          onClick={() => void saveAndLeave()}
          disabled={leaving || status === "saving"}
          className="absolute right-0 top-0 z-10 inline-flex shrink-0 rounded-xl border border-emerald-700 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-70"
        >
          {status === "saved" && !dirty && !leaving ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saveLabel}
        </Button>
        <div className="flex flex-col items-center gap-1 px-2 text-center sm:px-24">
          <div className="text-zinc-600">
            <ServiceMealTitle mealType={mealType} dateLabel={dateLabel} size="sm" />
          </div>
          <h1 className="mt-1 w-full text-center">
            <GroupNameBadge
              name={className ?? groupName}
              schoolName={schoolName}
              variant="plain"
            />
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            {status === "offline" ? (
              <CloudOff className="h-4 w-4 text-amber-700" aria-hidden />
            ) : null}
            <span>
              {status === "saving"
                ? "Sauvegarde..."
                : status === "saved"
                  ? "Sauvegardé"
                  : status === "offline"
                    ? "Enregistré localement — sync au retour du réseau"
                    : status === "error"
                      ? "Erreur de sauvegarde"
                      : dirty
                        ? "Modifications non sauvegardées"
                        : "À jour"}
            </span>
          </div>
          <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            Autosave
          </div>
        </div>

        {!online ? (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            Hors ligne : les chiffres sont gardés sur cet appareil et seront
            synchronisés au retour du réseau.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Counter
            label="Présents"
            value={m.presentCount}
            onChange={(presentCount) => setM((s) => ({ ...s, presentCount }))}
          />
          <Counter
            label="Portions servies"
            value={m.servedCount}
            onChange={(servedCount) => setM((s) => ({ ...s, servedCount }))}
          />
          <div className="sm:col-span-2">
            <Counter
              label="RAB"
              value={m.rabCount}
              onChange={(rabCount) => setM((s) => ({ ...s, rabCount }))}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Assiettes adaptées ou resservies (en plus du service standard).
            </p>
          </div>
          <Counter
            label="Refus"
            value={m.refusedCount}
            onChange={(refusedCount) => setM((s) => ({ ...s, refusedCount }))}
          />
          <Counter
            label="Restes"
            value={m.leftoversCount}
            onChange={(leftoversCount) => setM((s) => ({ ...s, leftoversCount }))}
          />
        </div>
      </div>
    </div>
  );
}
