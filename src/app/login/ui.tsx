"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginDecorPanel({
  src,
  alt,
  side,
  objectPosition = "object-center",
  priority = false,
}: {
  src: string;
  alt: string;
  side: "left" | "right";
  objectPosition?: string;
  priority?: boolean;
}) {
  const rounded =
    side === "left"
      ? "rounded-b-[2rem] lg:rounded-b-none lg:rounded-l-[2rem] lg:rounded-r-none"
      : "rounded-b-none rounded-t-[2rem] lg:rounded-l-none lg:rounded-r-[2rem] lg:rounded-t-none";
  const ringSide =
    side === "left"
      ? "shadow-xl ring-1 ring-border/40 ring-r-0"
      : "shadow-xl ring-1 ring-border/40 ring-l-0";

  return (
    <div
      className={`relative h-full min-h-[42vh] w-full overflow-hidden ${rounded} ${ringSide}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover ${objectPosition}`}
        sizes="(max-width: 1024px) 100vw, 50vw"
        quality={92}
        priority={priority}
      />
      <div className="absolute inset-0 bg-primary/12" />
    </div>
  );
}

export function LoginClient() {
  const [slug, setSlug] = useState("demo");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sp = useSearchParams();

  const nextPath = useMemo(() => sp.get("next") ?? "/service", [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim().toLowerCase(),
          pin: pin.replace(/\D/g, ""),
          next: nextPath,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Connexion impossible.");
        return;
      }
      const data = (await res.json()) as { redirectTo: string };
      window.location.assign(data.redirectTo);
    } catch {
      setError("Réseau indisponible. Réessayez dans un instant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] w-full flex-1 overflow-hidden">
      <div className="absolute inset-0 flex flex-col gap-0 lg:flex-row">
        <div className="relative min-h-[42vh] flex-1 lg:min-h-full lg:w-1/2">
          <LoginDecorPanel
            side="left"
            src="/login-chef-cuisine.png"
            alt="Chef en cuisine professionnelle"
            objectPosition="object-[center_30%]"
            priority
          />
        </div>
        <div className="relative min-h-[42vh] flex-1 lg:min-h-full lg:w-1/2">
          <LoginDecorPanel
            side="right"
            src="/login-buffet-salade.jpg"
            alt="Buffet de cantine avec légumes et salades fraîches"
          />
        </div>
      </div>

      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 rounded-lg bg-card/90 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground lg:top-8 lg:left-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;accueil
      </Link>

      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-16 sm:px-6">
        <Card className="w-full max-w-2xl gap-8 rounded-2xl border-border/60 bg-card py-8 shadow-2xl sm:py-10">
          <CardHeader className="space-y-3 px-8 sm:px-10">
            <CardTitle className="flex items-center gap-3 text-3xl font-bold tracking-tight text-primary">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Leaf className="h-6 w-6" aria-hidden />
              </span>
              Cantine360
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Code établissement, puis le code{" "}
              <strong className="text-foreground">cuisine</strong> ou{" "}
              <strong className="text-foreground">admin</strong> (deux codes
              distincts). Après un changement de code sur la plateforme,
              déconnectez-vous puis reconnectez-vous.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-2 sm:px-10">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2.5">
                <Label htmlFor="slug" className="text-base">
                  Code établissement
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  autoComplete="organization"
                  spellCheck={false}
                  className="h-12 font-mono text-base lowercase"
                  placeholder="ex. demo"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="pin" className="text-base">
                  Code accès
                </Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="h-12 pr-12 text-xl tracking-widest"
                    placeholder="••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPin ? "Masquer le code accès" : "Afficher le code accès"}
                  >
                    {showPin ? (
                      <EyeOff className="h-5 w-5" aria-hidden />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-base text-destructive">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="h-12 w-full text-base"
                disabled={
                  busy || slug.trim().length === 0 || pin.trim().length === 0
                }
              >
                {busy ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
