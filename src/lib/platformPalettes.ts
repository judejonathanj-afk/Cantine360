import type { CSSProperties } from "react";

export type PlatformPalette = {
  name: string;
  value: string;
  soft: string;
  bg: string;
};

export const PLATFORM_PALETTES: PlatformPalette[] = [
  { name: "Menthe", value: "#009b55", soft: "#c6fb80", bg: "#f3f9f5" },
  { name: "Océan", value: "#1769aa", soft: "#b7e2ff", bg: "#f3f8fc" },
  { name: "Prune", value: "#8e3a74", soft: "#f6c4e3", bg: "#fcf5fa" },
  { name: "Soleil", value: "#c87512", soft: "#ffe095", bg: "#fffaf0" },
];

export const DEFAULT_PLATFORM_PALETTE = PLATFORM_PALETTES[0];

export function platformPaletteStyle(p: PlatformPalette): CSSProperties {
  return {
    ["--brand" as string]: p.value,
    ["--soft" as string]: p.soft,
    ["--page-bg" as string]: p.bg,
  } as CSSProperties;
}
