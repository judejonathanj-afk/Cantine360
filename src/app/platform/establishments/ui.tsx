"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Plus, RefreshCw, Sparkles } from "lucide-react";
import { slugFromEstablishmentName } from "@/lib/establishmentSlug";
import { randomDistinctEstablishmentPins } from "@/lib/platformPins";

type EstablishmentRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { groups: number };
};

type CreatedPayload = {
  establishment: { id: string; name: string; slug: string };
  adminPin: string;
  kitchenPin: string;
};

export function PlatformEstablishmentsClient() {
  const [list, setList] = useState<EstablishmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [accessPins, setAccessPins] = useState(randomDistinctEstablishmentPins);
  const adminPin = accessPins.adminPin;
  const kitchenPin = accessPins.kitchenPin;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedPayload | null>(null);

  const slugPreview = useMemo(() => {
    const manual = slug.trim();
    if (manual) return slugFromEstablishmentName(manual);
    return slugFromEstablishmentName(name);
  }, [name, slug]);

  const applyListResponse = useCallback(
    (
      res: Response,
      data: { establishments?: EstablishmentRow[]; error?: string } | null,
    ): EstablishmentRow[] => {
      if (!res.ok) {
        setList([]);
        const apiError = data?.error?.trim();
        setListError(
          res.status === 401 || apiError === "Unauthorized"
            ? "Session plateforme expirée — reconnectez-vous sur /platform/login."
            : (apiError ??
                "Impossible de charger la liste (vérifiez DATABASE_URL sur Vercel)."),
        );
        return [];
      }
      const rows = data?.establishments ?? [];
      setList(rows);
      setListError(null);
      return rows;
    },
    [],
  );

  const load = useCallback(async (): Promise<EstablishmentRow[]> => {
    const res = await fetch("/api/platform/establishments");
    const data = (await res.json().catch(() => null)) as
      | { establishments: EstablishmentRow[]; error?: string }
      | null;
    return applyListResponse(res, data);
  }, [applyListResponse]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/platform/establishments")
      .then(async (res) => {
        if (cancelled) return [] as EstablishmentRow[];
        const data = (await res.json().catch(() => null)) as
          | { establishments: EstablishmentRow[]; error?: string }
          | null;
        return applyListResponse(res, data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyListResponse]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    const admin = adminPin.replace(/\D/g, "");
    const kitchen = kitchenPin.replace(/\D/g, "");
    try {
      const res = await fetch("/api/platform/establishments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          adminPin: admin,
          kitchenPin: kitchen,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { establishment: CreatedPayload["establishment"]; error?: string }
        | null;
      if (!res.ok) {
        const refreshed = await load();
        const base = data?.error ?? "Création impossible.";
        if (res.status === 409 && refreshed.length === 0) {
          setError(
            `${base} Si la liste reste vide, Vercel n’utilise peut‑être pas la même base que Supabase — vérifiez DATABASE_URL puis redéployez.`,
          );
        } else {
          setError(base);
        }
        return;
      }
      if (!data?.establishment) return;
      setCreated({
        establishment: data.establishment,
        adminPin: admin,
        kitchenPin: kitchen,
      });
      setName("");
      setSlug("");
      setAccessPins(randomDistinctEstablishmentPins());
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen-content">
      <div className="page-heading">
        <div className="heading-icon">
          <Building2 size={28} aria-hidden />
        </div>
        <div>
          <h1>Établissements</h1>
          <p>
            Créez un établissement sur place, puis remettez le <b>code établissement</b> et les
            deux <b>codes accès</b> (admin et cuisine) à l’équipe — connexion sur{" "}
            <span className="font-mono">/login</span>, pas ici.
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel create-panel">
          <div className="section-kicker">
            <Sparkles size={17} aria-hidden /> Provisionner un espace
          </div>
          <h2>Nouvel établissement</h2>
          <p>Pas d’inscription publique : seul cet espace crée des comptes cantine.</p>

          <form onSubmit={onCreate}>
            <label htmlFor="est-name">Nom</label>
            <input
              id="est-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="École élémentaire Les Tilleuls"
              required
            />

            <label htmlFor="est-slug">Code établissement (connexion)</label>
            <input
              id="est-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={slugPreview || "auto depuis le nom"}
              className="lowercase"
            />
            {name.trim() || slug.trim() ? (
              <span className="slug-hint">
                {slug.trim() ? (
                  <>
                    Code saisi (normalisé) : <code>{slugPreview}</code>
                  </>
                ) : (
                  <>
                    Sera enregistré comme :{" "}
                    <code>{slugPreview || "— code trop court"}</code>
                  </>
                )}
              </span>
            ) : null}

            <div className="two-columns">
              <div>
                <label htmlFor="est-admin-pin">Code admin</label>
                <input
                  id="est-admin-pin"
                  value={adminPin}
                  onChange={(e) =>
                    setAccessPins((p) => ({ ...p, adminPin: e.target.value }))
                  }
                  inputMode="numeric"
                  required
                />
              </div>
              <div>
                <label htmlFor="est-kitchen-pin">Code cuisine</label>
                <input
                  id="est-kitchen-pin"
                  value={kitchenPin}
                  onChange={(e) =>
                    setAccessPins((p) => ({ ...p, kitchenPin: e.target.value }))
                  }
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setAccessPins(randomDistinctEstablishmentPins())}
            >
              <RefreshCw size={16} aria-hidden /> Regénérer les codes
            </button>

            {error ? <p className="form-error">{error}</p> : null}

            <button
              type="submit"
              className="primary-button"
              disabled={busy || name.trim().length === 0}
            >
              <Plus size={17} aria-hidden /> {busy ? "Création…" : "Créer l’établissement"}
            </button>
          </form>

          {created ? (
            <div className="success-panel">
              <h3>À remettre sur place</h3>
              <p>
                <span>Établissement :</span> {created.establishment.name}
              </p>
              <p>
                <span>Code connexion :</span> {created.establishment.slug}
              </p>
              <p>
                <span>Code admin :</span> {created.adminPin}
              </p>
              <p>
                <span>Code cuisine :</span> {created.kitchenPin}
              </p>
            </div>
          ) : null}
        </section>

        <section className="list-section">
          <div className="list-title">
            <h2>
              Déjà créés <span>({loading ? "…" : list.length})</span>
            </h2>
            <span className="status-dot">● En ligne</span>
          </div>

          {listError ? <p className="form-error">{listError}</p> : null}

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Chargement…</p>
          ) : list.length === 0 && !listError ? (
            <p style={{ color: "var(--muted)" }}>Aucun établissement pour l’instant.</p>
          ) : (
            <div className="establishment-list">
              {list.map((e) => (
                <article className="establishment-item" key={e.id}>
                  <div>
                    <strong>{e.name}</strong>
                    <code>{e.slug}</code>
                  </div>
                  <span className="count">
                    {e._count.groups} groupe{e._count.groups !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/platform/establishments/${e.id}`}
                    className="manage-button"
                  >
                    Gérer <ArrowRight size={16} aria-hidden />
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
