import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "Cantine360 — Moins de gaspillage à la cantine scolaire",
  description:
    "Cantine360 relie la cuisine et l'administration : suivi des repas, pesées des déchets, menus et tableaux de bord pour produire et servir juste ce qu'il faut.",
};

/** Accueil public : toujours la landing, même si une session cookie est encore active. */
export default function Home() {
  return <LandingPage />;
}
