import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { getEstablishmentSession, getPlatformSession } from "@/server/auth";

export const metadata: Metadata = {
  title: "Cantine360 — Cantine scolaire, moins de gaspillage",
  description:
    "Cantine360 soutient la réduction du gaspillage en cantine scolaire en rendant visibles les écarts et en aidant à piloter les repas. Présences, portions, restes, menus. Un espace par établissement.",
};

export default async function Home() {
  const [establishment, platform] = await Promise.all([
    getEstablishmentSession(),
    getPlatformSession(),
  ]);
  if (platform) redirect("/platform/establishments");
  if (establishment) redirect("/service");
  return <LandingPage />;
}
