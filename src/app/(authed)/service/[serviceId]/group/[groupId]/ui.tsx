"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Counter } from "@/components/Counter";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { Button } from "@/components/ui/button";

type Metrics = {
  presentCount: number;
  servedCount: number;
  refusedCount: number;
  leftoversCount: number;
};

export function GroupMetricsEditor({
  serviceId,
  groupId,
  groupName,
  mealType,
  dateLabel,
  initial,
}: {
  serviceId: string;
  groupId: string;
  groupName: string;
  mealType: string;
  dateLabel: string;
  initial: Metrics;
}) {
  const router = useRouter();
  const [m, setM] = useState<Metrics>(initial);
  const [lastSaved, setLastSaved] = useState<Metrics>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [leaving, setLeaving] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const dirty = useMemo(() => {
    return (
      lastSaved.presentCount !== m.presentCount ||
      lastSaved.servedCount !== m.servedCount ||
      lastSaved.refusedCount !== m.refusedCount ||
      lastSaved.leftoversCount !== m.leftoversCount
    );
  }, [lastSaved, m]);

  const save = useCallback(
    async (next: Metrics) => {
      setStatus("saving");
      const res = await fetch(`/api/services/${serviceId}/metrics`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId, ...next }),
      });
      if (!res.ok) {
        setStatus("error");
        return false;
      }
      setLastSaved(next);
      setStatus("saved");
      window.setTimeout(() => setStatus("idle"), 800);
      return true;
    },
    [groupId, serviceId],
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
    if (dirty) {
      const ok = await save(m);
      if (!ok) {
        setLeaving(false);
        return;
      }
    }
    router.push(`/service/${serviceId}`);
  }

  const saveLabel =
    leaving || status === "saving"
      ? "Enregistrement…"
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
          <h1 className="mt-1 w-full text-center text-2xl font-semibold tracking-tight md:text-3xl">
            {groupName}
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-zinc-600">
            {status === "saving"
              ? "Sauvegarde..."
              : status === "saved"
                ? "Sauvegardé"
                : status === "error"
                  ? "Erreur de sauvegarde"
                  : dirty
                    ? "Modifications non sauvegardées"
                    : "À jour"}
          </div>
          <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            Autosave
          </div>
        </div>

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
