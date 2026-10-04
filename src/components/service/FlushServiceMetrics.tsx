"use client";

import { useEffect } from "react";
import {
  flushMetricsQueue,
  queuedMetricsCount,
} from "@/lib/offlineMetricsQueue";

/** Envoie d’un coup les compteurs quand on quitte le service ou ferme l’onglet. */
export function FlushServiceMetrics() {
  useEffect(() => {
    const flush = () => {
      if (queuedMetricsCount() === 0) return;
      void flushMetricsQueue();
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  return null;
}
