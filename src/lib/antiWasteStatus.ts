export type AntiWasteStatusTone = "ok" | "watch" | "alert" | "none";

/** Vert ≤ objectif · Orange ≤ 1,25× · Rouge au-delà. */
export function antiWasteStatus(
  gramsPer100: number | null,
  targetGPer100: number | null,
): { tone: AntiWasteStatusTone; label: string } {
  if (gramsPer100 == null || gramsPer100 <= 0) {
    return { tone: "none", label: "Pas encore de pesée" };
  }
  if (targetGPer100 == null || targetGPer100 <= 0) {
    return {
      tone: "watch",
      label: `${gramsPer100.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g / 100 — définir un objectif`,
    };
  }
  if (gramsPer100 <= targetGPer100) {
    return {
      tone: "ok",
      label: `Sous l’objectif (${targetGPer100.toLocaleString("fr-FR")} g / 100)`,
    };
  }
  if (gramsPer100 <= targetGPer100 * 1.25) {
    return {
      tone: "watch",
      label: `Au-dessus de l’objectif (${targetGPer100.toLocaleString("fr-FR")} g / 100)`,
    };
  }
  return {
    tone: "alert",
    label: `Bien au-dessus de l’objectif (${targetGPer100.toLocaleString("fr-FR")} g / 100)`,
  };
}
