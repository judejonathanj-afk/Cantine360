import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Cantine360 — Cantine scolaire, moins de gaspillage",
  description:
    "Cantine360 soutient la réduction du gaspillage en cantine scolaire en rendant visibles les écarts et en aidant à piloter les repas. Présences, portions, restes, menus. Un espace par établissement.",
};

/** Accueil public : toujours la landing, même si une session cookie est encore active. */
export default function Home() {
  return <LandingPage />;
}
