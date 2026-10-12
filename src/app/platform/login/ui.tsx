"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { PlatformBrand } from "@/components/platform/PlatformBrand";
import { usePlatformPalette } from "@/components/platform/PlatformPaletteProvider";

export function PlatformLoginClient() {
  const { style } = usePlatformPalette();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
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
    <main className="platform-ui login-page" style={style}>
      <div className="login-brand">
        <Link href="/" className="brand-link">
          <PlatformBrand />
        </Link>
      </div>

      <div className="login-hero">
        <h1>
          <span>ADMINISTRATION</span> <span>CANTINE360</span>
        </h1>
        <div className="hero-line" aria-hidden />
        <p>
          Créez et gérez les établissements — accès réservé à
          <br /> l’équipe plateforme.
        </p>
      </div>

      <section className="login-card">
        <h2>Accès plateforme</h2>
        <p>
          Réservé à l’équipe qui provisionne les établissements. Ce formulaire n’est pas l’accès
          cantine (admin / cuisine).
        </p>
        <form onSubmit={onSubmit}>
          <label htmlFor="platform-pin">Code plateforme</label>
          <div className="input-with-toggle">
            <input
              id="platform-pin"
              type={showPin ? "text" : "password"}
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
            />
            <button
              type="button"
              className="input-toggle-btn"
              onClick={() => setShowPin((v) => !v)}
              aria-label={showPin ? "Masquer le code plateforme" : "Afficher le code plateforme"}
            >
              {showPin ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
            </button>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button
            type="submit"
            className="primary-button wide"
            disabled={busy || pin.trim().length === 0}
          >
            {busy ? "Connexion…" : "Entrer"} <ArrowRight size={18} aria-hidden />
          </button>
        </form>
      </section>

      <div className="login-watermark" aria-hidden>
        Accès
        <br />
        plateforme
      </div>
    </main>
  );
}
