"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, LogOut, Palette, Settings2 } from "lucide-react";
import { PlatformBrand } from "@/components/platform/PlatformBrand";
import { usePlatformPalette } from "@/components/platform/PlatformPaletteProvider";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { palette, setPalette, style, palettes } = usePlatformPalette();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const establishmentsActive =
    pathname === "/platform/establishments" ||
    pathname.startsWith("/platform/establishments/");

  async function logout() {
    await fetch("/api/auth/platform-logout", { method: "POST" });
    window.location.assign("/platform/login");
  }

  return (
    <div className="platform-ui app-shell" style={style}>
      <div className="topbar-wrap">
        <header className="topbar">
          <Link href="/platform/establishments" className="brand-link">
            <PlatformBrand />
          </Link>
          <div className="header-actions">
            <button
              type="button"
              className="palette-trigger"
              onClick={() => setPaletteOpen((o) => !o)}
            >
              <Palette size={17} aria-hidden />
              Couleurs
            </button>
            <button type="button" className="logout" onClick={() => void logout()}>
              <LogOut size={17} aria-hidden />
              Déconnexion
            </button>
          </div>
        </header>
        {paletteOpen ? (
          <div className="palette-popover" role="dialog" aria-label="Choisir une ambiance">
            <strong>Choisir une ambiance</strong>
            <div className="palette-options">
              {palettes.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className={palette.name === option.name ? "selected" : ""}
                  onClick={() => {
                    setPalette(option);
                    setPaletteOpen(false);
                  }}
                >
                  <span style={{ background: option.value }} aria-hidden />
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <nav className="subnav" aria-label="Navigation plateforme">
        <Link
          href="/platform/establishments"
          className={establishmentsActive ? "active" : undefined}
        >
          <Building2 size={17} aria-hidden />
          Établissements
        </Link>
        <button type="button" disabled title="Bientôt disponible">
          <Settings2 size={17} aria-hidden />
          Paramètres
        </button>
      </nav>

      {children}
    </div>
  );
}
