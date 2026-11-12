"use client";

import { useCallback, useEffect, useState } from "react";
import { SCHOOL_LEVELS, type SchoolLevel } from "@/lib/schoolLevel";

export type LevelFilterValue = "all" | SchoolLevel;

const storageKey = (scope: string) => `cantine360-level:${scope}`;

export function levelsForFilter(level: LevelFilterValue): SchoolLevel[] {
  return level === "all" ? [...SCHOOL_LEVELS] : [level];
}

/** Filtre niveau propre à une fenêtre / page, sans toucher à l’URL des autres. */
export function useScopedLevelFilter(
  scope: string,
  fallback: LevelFilterValue = "all",
) {
  const [level, setLevel] = useState<LevelFilterValue>(fallback);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(scope));
      if (raw === "MATERNELLE" || raw === "PRIMAIRE" || raw === "all") {
        setLevel(raw);
      }
    } catch {
      /* ignore */
    }
  }, [scope]);

  const update = useCallback((next: LevelFilterValue) => {
    setLevel(next);
    try {
      sessionStorage.setItem(storageKey(scope), next);
    } catch {
      /* ignore */
    }
  }, [scope]);

  return [level, update] as const;
}
