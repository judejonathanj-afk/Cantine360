"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, RefreshCw } from "lucide-react";
import {
  randomDistinctEstablishmentPins,
  randomEstablishmentPin,
} from "@/lib/platformPins";

type EstablishmentDetail = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  _count: { groups: number; services: number };
};

type SavedCodes = {
  slug: string;
  adminPin?: string;
  kitchenPin?: string;
};

export function PlatformEstablishmentEditClient({
  establishmentId,
}: {
  establishmentId: string;
}) {
  const [detail, setDetail] = useState<EstablishmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [kitchenPin, setKitchenPin] = useState("");
  const [changeAdminPin, setChangeAdminPin] = useState(false);
  const [changeKitchenPin, setChangeKitchenPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedCodes | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/platform/establishments/${establishmentId}`);
      if (res.status === 404) {
        setDetail(null);
        return;
      }
      if (!res.ok) {
        setError("Impossible de charger l’établissement.");
        return;
      }
      const data = (await res.json()) as { establishment: EstablishmentDetail };
      setDetail(data.establishment);
      setName(data.establishment.name);
      setSlug(data.establishment.slug);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/platform/establishments/${establishmentId}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setDetail(null);
          return;
        }
        if (!res.ok) {
          setError("Impossible de charger l’établissement.");
          return;
        }
        const data = (await res.json()) as { establishment: EstablishmentDetail };
        setDetail(data.establishment);
        setName(data.establishment.name);
        setSlug(data.establishment.slug);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [establishmentId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(null);
    setInfo(null);

    const body: Record<string, string> = {
      name: name.trim(),
      slug: slug.trim(),
    };
    if (changeAdminPin) body.adminPin = adminPin.replace(/\D/g, "");
    if (changeKitchenPin) body.kitchenPin = kitchenPin.replace(/\D/g, "");

    try {
      const res = await fetch(`/api/platform/establishments/${establishmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        establishment?: { name: string; slug: string };
        codesUpdated?: boolean;
        pinChanges?: { adminPin?: string; kitchenPin?: string };
        error?: string;
      } | null;

      if (!res.ok) {
        setError(data?.error ?? "Enregistrement impossible.");
        return;
      }

      if (data?.establishment) {
        setName(data.establishment.name);
        setSlug(data.establishment.slug);
        await load();
      }

      const changes = data?.pinChanges;
      const hasPinChange =
        changes && (changes.adminPin !== undefined || changes.kitchenPin !== undefined);

      if (data?.codesUpdated && hasPinChange && changes) {
        setSaved({
          slug: data.establishment?.slug ?? slug.trim(),
          ...(changes.adminPin !== undefined ? { adminPin: changes.adminPin } : {}),
          ...(changes.kitchenPin !== undefined ? { kitchenPin: changes.kitchenPin } : {}),
        });
        setChangeAdminPin(false);
        setChangeKitchenPin(false);
        setAdminPin("");
        setKitchenPin("");
      } else {
        setInfo("Nom ou code établissement mis à jour.");
      }
    } finally {
      setBusy(false);
    }
  }

  function resetBothPins() {
    setChangeAdminPin(true);
    setChangeKitchenPin(true);
    const pins = randomDistinctEstablishmentPins();
    setAdminPin(pins.adminPin);
    setKitchenPin(pins.kitchenPin);
  }

  if (loading) {
    return (
      <div className="detail-content">
        <p style={{ color: "var(--muted)" }}>Chargement…</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="detail-content">
        <p className="form-error">Établissement introuvable.</p>
        <Link href="/platform/establishments" className="back-link">
          <ArrowLeft size={17} aria-hidden /> Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="detail-content">
      <Link href="/platform/establishments" className="back-link">
        <ArrowLeft size={17} aria-hidden /> Retour à la liste
      </Link>

      <div className="detail-heading">
        <h1>{detail.name}</h1>
        <code>{detail.slug}</code>
        <p>
          {detail._count.groups} groupe{detail._count.groups !== 1 ? "s" : ""} ·{" "}
          {detail._count.services} service{detail._count.services !== 1 ? "s" : ""} enregistré
          {detail._count.services !== 1 ? "s" : ""}
        </p>
      </div>

      <section className="panel edit-panel">
        <h2>Modifier l’établissement</h2>
        <p>
          Nom et code de connexion. Cochez « nouveau code » pour réinitialiser admin ou cuisine,
          puis enregistrez et remettez les codes sur place.
        </p>

        <form onSubmit={onSubmit}>
          <label htmlFor="edit-name">Nom</label>
          <input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label htmlFor="edit-slug">Code établissement (connexion /login)</label>
          <input
            id="edit-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="lowercase"
            required
          />
          <small className="warning">
            Si vous changez ce code, l’ancien ne fonctionnera plus à la connexion.
          </small>

          <div className="access-box">
            <h3>Codes d’accès</h3>
            <button type="button" className="secondary-button" onClick={resetBothPins}>
              <RefreshCw size={16} aria-hidden /> Regénérer admin + cuisine
            </button>

            <label className="check-row">
              <input
                type="checkbox"
                checked={changeAdminPin}
                onChange={(e) => {
                  setChangeAdminPin(e.target.checked);
                  if (e.target.checked && !adminPin) setAdminPin(randomEstablishmentPin());
                }}
              />
              <span>
                <b>Nouveau code admin</b>
                {changeAdminPin ? (
                  <input
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    inputMode="numeric"
                    required
                    style={{ marginTop: 10 }}
                  />
                ) : (
                  <small>Inchangé — cochez pour en définir un nouveau.</small>
                )}
              </span>
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={changeKitchenPin}
                onChange={(e) => {
                  setChangeKitchenPin(e.target.checked);
                  if (e.target.checked && !kitchenPin) setKitchenPin(randomEstablishmentPin());
                }}
              />
              <span>
                <b>Nouveau code cuisine</b>
                {changeKitchenPin ? (
                  <input
                    value={kitchenPin}
                    onChange={(e) => setKitchenPin(e.target.value)}
                    inputMode="numeric"
                    required
                    style={{ marginTop: 10 }}
                  />
                ) : (
                  <small>Inchangé — cochez pour en définir un nouveau.</small>
                )}
              </span>
            </label>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          {info ? <p className="info-banner">{info}</p> : null}

          <button type="submit" className="primary-button" disabled={busy}>
            <Check size={17} aria-hidden />{" "}
            {busy ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </form>
      </section>

      {saved ? (
        <div className="success-panel">
          <h3>Codes mis à jour — à remettre</h3>
          <p>
            <span>Code établissement :</span> {saved.slug}
          </p>
          {saved.adminPin !== undefined ? (
            <p>
              <span>Nouveau code admin :</span> {saved.adminPin}
            </p>
          ) : null}
          {saved.kitchenPin !== undefined ? (
            <p>
              <span>Nouveau code cuisine :</span> {saved.kitchenPin}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
