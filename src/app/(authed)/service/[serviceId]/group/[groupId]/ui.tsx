"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CloudOff } from "lucide-react";
import { Counter } from "@/components/Counter";
import { GroupNameBadge } from "@/components/GroupNameBadge";
import { ClassAllergenList } from "@/components/service/ClassAllergenList";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  enqueueMetricsSave,
  getQueuedMetrics,
} from "@/lib/offlineMetricsQueue";
import type { SchoolLevel } from "@/lib/schoolLevel";
import { schoolLevelLabelFr } from "@/lib/schoolLevel";
import type { StudentAllergenRow } from "@/server/serviceAllergenSummary";

type Metrics = {
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
};

export function GroupMetricsEditor({
  serviceId,
  groupId,
  groupName,
  schoolName,
  className,
  mealType,
  dateLabel,
  level,
  initial,
  allergenStudents,
  hasMenu,
}: {
  serviceId: string;
  groupId: string;
  groupName: string;
  schoolName?: string;
  className?: string;
  mealType: string;
  dateLabel: string;
  level: SchoolLevel;
  initial: Metrics;
  allergenStudents?: StudentAllergenRow[];
  hasMenu?: boolean;
}) {
  const router = useRouter();
  const online = useOnlineStatus();
  const [m, setM] = useState<Metrics>(initial);
  const [lastSaved, setLastSaved] = useState<Metrics>(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "offline">("idle");
  const [heldLocally, setHeldLocally] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const queued = getQueuedMetrics(serviceId, groupId);
    if (!queued) return;
    setM(queued.metrics);
    setLastSaved(queued.metrics);
    setHeldLocally(true);
    setStatus("saved");
  }, [serviceId, groupId]);

  const dirty = useMemo(() => {
    return (
      lastSaved.presentCount !== m.presentCount ||
      lastSaved.servedCount !== m.servedCount ||
      lastSaved.rabCount !== m.rabCount ||
      lastSaved.refusedCount !== m.refusedCount
    );
  }, [lastSaved, m]);

  const save = useCallback(
    (next: Metrics) => {
      enqueueMetricsSave(serviceId, groupId, next);
      setLastSaved(next);
      setHeldLocally(true);
      setStatus(online ? "saved" : "offline");
      if (online) window.setTimeout(() => setStatus("idle"), 800);
    },
    [groupId, online, serviceId],
  );

  useEffect(() => {
    if (!dirty) return;
    save(m);
  }, [dirty, m, save]);

  function saveAndLeave() {
    setLeaving(true);
    try {
      if (dirty) save(m);
      router.push(`/service/${serviceId}?group=${groupId}`);
    } finally {
      setLeaving(false);
    }
  }

  const saveLabel = leaving
    ? "Enregistrement…"
    : !online
      ? dirty
        ? "Enregistrer localement"
        : "Enregistré (local)"
      : "Enregistrer";

  const counterBorder =
    level === "MATERNELLE" ? "border-sky-400" : "border-emerald-500";

  return (
    <div className="space-y-6">
      <div className="relative px-2">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] sm:items-start">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-left sm:mt-1 sm:max-w-[16rem]">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-700">
              À faire
            </p>
            <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 text-sm leading-snug text-zinc-800">
              <li>
                Remplissez chaque compteur avec les{" "}
                <strong className="font-semibold">+/−</strong> (ou en tapant le
                nombre).
              </li>
              <li>
                Consultez{" "}
                <strong className="font-semibold">
                  Élèves concernés par le menu
                </strong>
                , puis appuyez sur{" "}
                <strong className="font-semibold">Enregistrer</strong> en bas de
                page.
              </li>
            </ol>
          </div>

          <div className="flex flex-col items-center gap-1 px-2 text-center sm:px-4">
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
            <p
              className={[
                "text-sm font-semibold sm:text-base",
                level === "MATERNELLE" ? "text-sky-700" : "text-emerald-700",
              ].join(" ")}
            >
              {schoolLevelLabelFr(level)}
            </p>
          </div>

          <div className="hidden sm:block" aria-hidden />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            {status === "offline" ? (
              <CloudOff className="h-4 w-4 text-amber-700" aria-hidden />
            ) : null}
            <span>
              {!online || status === "offline"
                ? "Enregistré localement — sync au retour du réseau"
                : dirty
                  ? "Modifications non sauvegardées"
                  : heldLocally
                    ? "Gardé sur cet appareil — envoi groupé en fin de service"
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
            className={counterBorder}
          />
          <Counter
            label="Portions servies"
            value={m.servedCount}
            onChange={(servedCount) => setM((s) => ({ ...s, servedCount }))}
            className={counterBorder}
          />
          <div className="sm:col-span-2">
            <Counter
              label="RAB = Assiettes adaptées ou resservies (en plus du service standard)."
              value={m.rabCount}
              onChange={(rabCount) => setM((s) => ({ ...s, rabCount }))}
              className={counterBorder}
            />
          </div>
          <div className="sm:col-span-2">
            <Counter
              label="Refus"
              value={m.refusedCount}
              onChange={(refusedCount) => setM((s) => ({ ...s, refusedCount }))}
              className={counterBorder}
            />
          </div>
        </div>
      </div>

      {allergenStudents ? (
        <section className="space-y-4">
          <div className="border-t border-zinc-300 pt-6" role="separator" aria-hidden />
          <h2 className="flex items-center justify-center gap-2.5 text-2xl font-semibold text-zinc-900 sm:text-3xl">
            <AlertTriangle
              className="h-7 w-7 shrink-0 text-yellow-500 sm:h-8 sm:w-8"
              aria-hidden
            />
            Élèves concernés par le menu
          </h2>
          <ClassAllergenList students={allergenStudents} hasMenu={hasMenu ?? false} />
        </section>
      ) : null}

      <div className="flex justify-center border-t border-zinc-200 pt-6 pb-2">
        <Button
          type="button"
          onClick={() => void saveAndLeave()}
          disabled={leaving}
          className="inline-flex min-w-[12rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-70"
        >
          {status === "saved" && !dirty && !leaving ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
