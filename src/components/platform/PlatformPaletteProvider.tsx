"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_PLATFORM_PALETTE,
  PLATFORM_PALETTES,
  type PlatformPalette,
  platformPaletteStyle,
} from "@/lib/platformPalettes";

const STORAGE_KEY = "c360-platform-palette";

type Ctx = {
  palette: PlatformPalette;
  setPalette: (p: PlatformPalette) => void;
  style: React.CSSProperties;
  palettes: PlatformPalette[];
};

const PlatformPaletteContext = createContext<Ctx | null>(null);

export function PlatformPaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PlatformPalette>(DEFAULT_PLATFORM_PALETTE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const found = PLATFORM_PALETTES.find((p) => p.name === raw);
      if (found) setPaletteState(found);
    } catch {
      /* ignore */
    }
  }, []);

  const setPalette = useCallback((p: PlatformPalette) => {
    setPaletteState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p.name);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      palette,
      setPalette,
      style: platformPaletteStyle(palette),
      palettes: PLATFORM_PALETTES,
    }),
    [palette, setPalette],
  );

  return (
    <PlatformPaletteContext.Provider value={value}>{children}</PlatformPaletteContext.Provider>
  );
}

export function usePlatformPalette() {
  const ctx = useContext(PlatformPaletteContext);
  if (!ctx) {
    return {
      palette: DEFAULT_PLATFORM_PALETTE,
      setPalette: () => {},
      style: platformPaletteStyle(DEFAULT_PLATFORM_PALETTE),
      palettes: PLATFORM_PALETTES,
    };
  }
  return ctx;
}
