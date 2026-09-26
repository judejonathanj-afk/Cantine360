"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, CalendarDays, Check, Sparkles, Utensils } from "lucide-react";
import { SCHOOL_MEAL_TYPE } from "@/lib/mealType";
import "./service-home.css";

const palette = ["#8dc7f3", "#c58bdc", "#f4a23a", "#e87568", "#a5d7b5", "#f3d86b"];

function todayYyyyMmDd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="Service cantine">
      {"SERVICE CANTINE".split("").map((letter, index) => (
        <span key={`${letter}-${index}`} style={{ color: palette[index % palette.length] }}>
          {letter === " " ? "\u00a0" : letter}
        </span>
      ))}
    </div>
  );
}

function DecorativeIllustration() {
  return (
    <div className="illustration" aria-hidden="true">
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="sun">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="plate">
        <div className="plate-food food-one" />
        <div className="plate-food food-two" />
        <div className="plate-food food-three" />
      </div>
    </div>
  );
}

export default function ServiceHomeClient() {
  const [date, setDate] = useState(todayYyyyMmDd());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const prettyDate = useMemo(() => {
    try {
      return format(new Date(`${date}T12:00:00`), "EEEE d MMMM yyyy", { locale: fr });
    } catch {
      return date;
    }
  }, [date]);

  async function startService() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/services/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date, mealType: SCHOOL_MEAL_TYPE }),
      });
      if (!res.ok) {
        setError("Impossible de créer/ouvrir le service (base ou réseau).");
        return;
      }
      const data = (await res.json()) as { serviceId: string };
      setSuccess(true);
      window.setTimeout(() => {
        window.location.assign(`/service/${data.serviceId}/menu`);
      }, 600);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="service-home">
      <div className="ambient ambient-top" />
      <div className="ambient ambient-bottom" />

      <section className="hero-panel">
        <DecorativeIllustration />
        <div className="hero-content">
          <BrandMark />
          <p className="hero-copy">
            La <strong>date du déjeuner</strong> est sélectionnée automatiquement. Appuyez
            sur « Démarrer le service » pour saisir les groupes.
          </p>
          <div className="hero-pills" aria-label="Fonctionnalités">
            <span>Simple</span>
            <span>Rapide</span>
            <span>Anti-gaspi</span>
            <div className="eyebrow">
              <Sparkles aria-hidden="true" /> Réduisons le gaspillage ensemble
            </div>
          </div>
        </div>
      </section>

      <section className="setup-grid" aria-label="Configuration du service">
        <article className="setup-card date-card">
          <div className="card-heading">
            <div className="icon-box green">
              <CalendarDays aria-hidden="true" />
            </div>
            <div>
              <h2>Date du service</h2>
              <p>Sélectionnez la date du déjeuner à suivre</p>
            </div>
          </div>
          <label className="date-field">
            <span className="sr-only">Date du déjeuner</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            <CalendarDays aria-hidden="true" />
          </label>
          <div className="selected-date">
            <span>Date sélectionnée</span>
            <strong>{prettyDate}</strong>
          </div>
        </article>

        <article className="setup-card meal-card">
          <div className="card-heading">
            <div className="icon-box green">
              <Utensils aria-hidden="true" />
            </div>
            <div>
              <h2>Repas</h2>
              <p>
                Maternelle et primaire : suivi du <strong>déjeuner</strong> (midi) uniquement.
              </p>
            </div>
          </div>
          <div className="meal-option" role="status">
            <div className="meal-icon">
              <span>☀</span>
            </div>
            <div>
              <strong>Déjeuner</strong>
              <p>Service de midi — seul créneau suivi</p>
            </div>
            <Check className="check" aria-hidden="true" />
          </div>
        </article>
      </section>

      <button
        type="button"
        className={`start-button ${success ? "started" : ""}`}
        disabled={busy}
        onClick={() => void startService()}
      >
        {success ? <Check aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
        {busy ? "Ouverture…" : success ? "Service prêt" : "Démarrer le service"}
        <ArrowRight aria-hidden="true" />
      </button>
      {error ? <p className="home-error">{error}</p> : null}
      <p className="footer-note">Un service à la fois, zéro gaspillage inutile.</p>
    </div>
  );
}
