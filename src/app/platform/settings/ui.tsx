"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, Settings2, Shield } from "lucide-react";

type SettingsInfo = {
  loginPath: string;
  establishmentsPath: string;
  pinSource: "database" | "environment";
  pinSourceLabel: string;
  sessionHours: number;
  guardConfigured: boolean;
};

function PinField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="input-with-toggle">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
        />
        <button
          type="button"
          className="input-toggle-btn"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? `Masquer ${label}` : `Afficher ${label}`}
        >
          {show ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
        </button>
      </div>
    </>
  );
}

export function PlatformSettingsClient() {
  const [info, setInfo] = useState<SettingsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/platform/settings")
      .then(async (res) => {
        if (!res.ok) throw new Error("load");
        return (await res.json()) as SettingsInfo;
      })
      .then(setInfo)
      .catch(() => setError("Impossible de charger les paramètres."))
      .finally(() => setLoading(false));
  }, []);

  async function onChangePin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/platform/settings/pin", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPin, newPin, confirmPin }),
      });
      const data = (await res.json().catch(() => null)) as {
        message?: string;
        error?: string;
        pinSource?: SettingsInfo["pinSource"];
      } | null;
      if (!res.ok) {
        setError(data?.error ?? "Modification impossible.");
        return;
      }
      setSuccess(data?.message ?? "Code mis à jour.");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      if (data?.pinSource && info) {
        setInfo({
          ...info,
          pinSource: data.pinSource,
          pinSourceLabel:
            "Code enregistré dans Cantine360 (modifiable ci-dessous).",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://cantine360.vercel.app";

  return (
    <div className="screen-content settings-content">
      <div className="page-heading">
        <div className="heading-icon">
          <Settings2 size={28} aria-hidden />
        </div>
        <div>
          <h1>Paramètres</h1>
          <p>Accès plateforme Omnerys, sécurité et code de connexion administrateur.</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Chargement…</p>
      ) : (
        <div className="settings-stack">
          <section className="panel">
            <div className="section-kicker">
              <Shield size={17} aria-hidden /> Accès plateforme
            </div>
            <h2>Connexion & périmètre</h2>
            <p>
              Cet espace sert à <b>créer et gérer les établissements</b>. Les équipes cantine
              (admin / cuisine) se connectent sur <code>/login</code>, pas ici.
            </p>
            <ul className="settings-list">
              <li>
                <span>URL de connexion plateforme</span>
                <Link href="/platform/login" className="settings-link">
                  {origin}/platform/login
                </Link>
              </li>
              <li>
                <span>Gestion des établissements</span>
                <Link href="/platform/establishments" className="settings-link">
                  {origin}/platform/establishments
                </Link>
              </li>
              <li>
                <span>Durée de session</span>
                <strong>{info?.sessionHours ?? 12} h</strong> (reconnexion ensuite)
              </li>
              <li>
                <span>Source du code actuel</span>
                <strong>{info?.pinSource === "database" ? "Cantine360 (base)" : "Vercel (.env)"}</strong>
              </li>
              {info?.guardConfigured ? (
                <li>
                  <span>Cantine Guard</span>
                  <strong>Actif</strong> (sonde prod configurée)
                </li>
              ) : null}
            </ul>
            {info?.pinSourceLabel ? (
              <p className="settings-note">{info.pinSourceLabel}</p>
            ) : null}
          </section>

          <section className="panel">
            <div className="section-kicker">
              <KeyRound size={17} aria-hidden /> Code plateforme
            </div>
            <h2>Changer mon code d’accès</h2>
            <p>
              Minimum <b>6 chiffres</b>. Après changement, le code est stocké de façon sécurisée
              dans la base (il prime sur la variable Vercel <code>PLATFORM_PIN</code>).
            </p>

            <form onSubmit={onChangePin}>
              <PinField
                id="current-platform-pin"
                label="Code actuel"
                value={currentPin}
                onChange={setCurrentPin}
              />
              <div className="two-columns">
                <div>
                  <PinField
                    id="new-platform-pin"
                    label="Nouveau code"
                    value={newPin}
                    onChange={setNewPin}
                  />
                </div>
                <div>
                  <PinField
                    id="confirm-platform-pin"
                    label="Confirmer le nouveau code"
                    value={confirmPin}
                    onChange={setConfirmPin}
                  />
                </div>
              </div>

              {error ? <p className="form-error">{error}</p> : null}
              {success ? <p className="info-banner">{success}</p> : null}

              <button
                type="submit"
                className="primary-button"
                disabled={
                  busy ||
                  !currentPin.trim() ||
                  !newPin.trim() ||
                  !confirmPin.trim()
                }
              >
                {busy ? "Enregistrement…" : "Enregistrer le nouveau code"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
