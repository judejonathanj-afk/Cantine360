"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Counter } from "@/components/Counter";
import { enqueueMetricsSave } from "@/lib/offlineMetricsQueue";

type Metrics = {
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
};

export function ClassCardCounters({
  serviceId,
  groupId,
  initial,
}: {
  serviceId: string;
  groupId: string;
  initial: Metrics;
}) {
  const [m, setM] = useState<Metrics>(initial);

  useEffect(() => {
    setM(initial);
  }, [
    initial.presentCount,
    initial.servedCount,
    initial.rabCount,
    initial.refusedCount,
  ]);

  function update(next: Metrics) {
    setM(next);
    enqueueMetricsSave(serviceId, groupId, next);
  }

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-left text-base font-extrabold text-zinc-950 sm:text-lg">
        Compteurs
      </p>
      <div className="grid grid-cols-2 gap-2.5">
      <Counter
        size="compact"
        label="Présents"
        value={m.presentCount}
        onChange={(presentCount) => update({ ...m, presentCount })}
      />
      <Counter
        size="compact"
        label="Servis"
        value={m.servedCount}
        onChange={(servedCount) => update({ ...m, servedCount })}
      />
      <Counter
        size="compact"
        label="RAB"
        value={m.rabCount}
        onChange={(rabCount) => update({ ...m, rabCount })}
      />
      <Counter
        size="compact"
        label="Refus"
        value={m.refusedCount}
        onChange={(refusedCount) => update({ ...m, refusedCount })}
      />
      <p className="col-span-2 text-right">
        <Link
          href={`/service/${serviceId}/group/${groupId}`}
          className="text-sm font-semibold text-zinc-700 underline-offset-2 hover:underline"
        >
          Fiche allergènes
        </Link>
      </p>
      </div>
    </div>
  );
}
