"use client";

import { useEffect, useState } from "react";
import {
  listQueuedMetrics,
  type QueuedMetricsEntry,
} from "@/lib/offlineMetricsQueue";

export function useQueuedMetrics(serviceId: string): QueuedMetricsEntry[] {
  const [entries, setEntries] = useState<QueuedMetricsEntry[]>([]);

  useEffect(() => {
    if (!serviceId) return;
    const read = () => {
      setEntries(listQueuedMetrics().filter((e) => e.serviceId === serviceId));
    };
    read();
    window.addEventListener("c360-offline-queue", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("c360-offline-queue", read);
      window.removeEventListener("storage", read);
    };
  }, [serviceId]);

  return entries;
}
