"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cantine360-night-mode";

export function useNightMode() {
  const [nightMode, setNightModeState] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "0") setNightModeState(false);
      else if (stored === "1") setNightModeState(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", nightMode);
    try {
      localStorage.setItem(STORAGE_KEY, nightMode ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [nightMode]);

  const toggleNightMode = useCallback(() => {
    setNightModeState((prev) => !prev);
  }, []);

  return { nightMode, toggleNightMode };
}
