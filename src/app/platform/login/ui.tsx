"use client";

import Link from "next/link";
import { useState } from "react";
import { Leaf } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PlatformLoginClient() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/platform-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin: pin.replace(/\D/g, "") }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Connexion impossible.");
        return;
      }
      const data = (await res.json()) as { redirectTo: string };
      window.location.assign(data.redirectTo);
    } catch {
      setError("Réseau indisponible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 flex">
        <div className="w-1/2 bg-background" />
        <div className="w-1/2 bg-black" />
      </div>
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-3 sm:top-8 sm:left-8"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <Leaf className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-lg font-bold tracking-tight text-foreground">Cantine360</span>
      </Link>
      <p
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-0 z-0 w-1/2 max-w-none select-none px-3 text-balance bg-gradient-to-br from-emerald-300/40 via-emerald-400/22 to-emerald-600/12 bg-clip-text text-center font-extrabold leading-[0.88] tracking-[-0.03em] text-transparent text-[clamp(2.25rem,9vw,6rem)] sm:bottom-4 sm:px-6 md:bottom-6"
      >
        Accès plateforme
      </p>
      <p
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-2 z-0 w-1/2 max-w-none select-none px-3 text-balance bg-gradient-to-br from-emerald-200/35 via-emerald-300/22 to-white/10 bg-clip-text text-center font-extrabold leading-[0.88] tracking-[-0.03em] text-transparent text-[clamp(2.25rem,9vw,6rem)] sm:bottom-4 sm:px-6 md:bottom-6"
      >
        Accès plateforme
      </p>
      <Card className="relative z-10 w-full max-w-xl border-border/50 bg-card/95 shadow-md backdrop-blur-sm">
        <CardHeader className="space-y-3 px-8 pb-4 pt-8">
          <CardTitle className="text-2xl md:text-3xl">Accès plateforme</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Réservé à l’équipe qui provisionne les établissements. Ce formulaire n’est pas
            l’accès cantine (admin / cuisine).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="platform-pin" className="text-base">
                Code plateforme
              </Label>
              <Input
                id="platform-pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                className="h-14 text-xl tracking-widest"
                placeholder="••••••"
              />
            </div>
            {error ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full text-base"
              disabled={busy || pin.trim().length === 0}
            >
              {busy ? "Connexion…" : "Entrer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
