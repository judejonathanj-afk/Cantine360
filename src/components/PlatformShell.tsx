"use client";

import Link from "next/link";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  async function logout() {
    await fetch("/api/auth/platform-logout", { method: "POST" });
    window.location.assign("/platform/login");
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 flex">
        <div className="w-1/2 bg-background" />
        <div className="w-1/2 bg-black" />
      </div>
      <header className="relative z-10 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/platform/establishments" className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" aria-hidden />
            <span className="font-semibold text-foreground">Cantine360 — Plateforme</span>
          </Link>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => void logout()}>
            <LogOut className="h-4 w-4" aria-hidden />
            Déconnexion
          </Button>
        </div>
      </header>
      <main className="relative z-10 w-full flex-1">{children}</main>
    </div>
  );
}
