"use client";

import type { ReactNode } from "react";

/**
 * Enveloppe client sans next-themes : cette lib injecte un script inline dans le
 * rendu React, ce que React 19 signale comme erreur. Le pilote Cantine360 est
 * en thème clair fixe ; un thème dynamique pourra repasser par des classes sur
 * la balise html ou une lib compatible React 19.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
