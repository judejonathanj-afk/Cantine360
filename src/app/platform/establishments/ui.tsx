"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { slugFromEstablishmentName } from "@/lib/establishmentSlug";
import { randomEstablishmentPin } from "@/lib/platformPins";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [adminPin, setAdminPin] = useState(() => randomEstablishmentPin());
  const [kitchenPin, setKitchenPin] = useState(() => randomEstablishmentPin());
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
        setListError(
          data?.error ??
            (res.status === 401
              ? "Session plateforme expirée — reconnectez-vous sur /platform/login."
              : "Impossible de charger la liste (vérifiez DATABASE_URL sur Vercel)."),
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
      setAdminPin(randomEstablishmentPin());
      setKitchenPin(randomEstablishmentPin());
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100dvh-4rem)] w-full grid-cols-1 lg:grid-cols-2">
      <div className="space-y-6 px-4 py-8 sm:px-8 lg:py-10">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Building2 className="h-6 w-6" aria-hidden />
            </span>
            Établissements
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Créez un établissement sur place, puis remettez le{" "}
          <strong className="text-foreground">code établissement</strong> et les deux{" "}
          <strong className="text-foreground">codes accès</strong> (admin et cuisine) à
          l’équipe — connexion sur <span className="font-mono">/login</span>, pas ici.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nouvel établissement</CardTitle>
          <CardDescription>
            Pas d’inscription publique : seul cet espace crée des comptes cantine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="est-name">Nom</Label>
              <Input
                id="est-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="École élémentaire Les Tilleuls"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-slug">Code établissement (connexion)</Label>
              <Input
                id="est-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-sm lowercase"
                placeholder={slugPreview || "auto depuis le nom"}
              />
              {slugPreview ? (
                <p className="text-xs text-muted-foreground">
                  Sera enregistré comme :{" "}
                  <span className="font-mono font-medium text-foreground">{slugPreview}</span>
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="est-admin-pin">Code admin</Label>
                <Input
                  id="est-admin-pin"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  inputMode="numeric"
                  className="font-mono tracking-widest"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="est-kitchen-pin">Code cuisine</Label>
                <Input
                  id="est-kitchen-pin"
                  value={kitchenPin}
                  onChange={(e) => setKitchenPin(e.target.value)}
                  inputMode="numeric"
                  className="font-mono tracking-widest"
                  required
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAdminPin(randomEstablishmentPin());
                  setKitchenPin(randomEstablishmentPin());
                }}
              >
                Regénérer les codes
              </Button>
            </div>
            {error ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy || name.trim().length === 0}>
              {busy ? "Création…" : "Créer l’établissement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {created ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">À remettre sur place</CardTitle>
            <CardDescription>
              Notez ces informations avant de quitter l’écran (les codes ne sont plus
              affichés ensuite).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm">
            <p>
              <span className="text-muted-foreground">Établissement :</span>{" "}
              {created.establishment.name}
            </p>
            <p>
              <span className="text-muted-foreground">Code connexion :</span>{" "}
              {created.establishment.slug}
            </p>
            <p>
              <span className="text-muted-foreground">Code admin :</span> {created.adminPin}
            </p>
            <p>
              <span className="text-muted-foreground">Code cuisine :</span>{" "}
              {created.kitchenPin}
            </p>
          </CardContent>
        </Card>
      ) : null}
      </div>

      <section className="space-y-4 px-4 py-8 text-white sm:px-8 lg:py-10">
        <h2 className="text-lg font-semibold text-white md:text-xl">
          Déjà créés ({loading ? "…" : list.length})
        </h2>
        {listError ? (
          <p className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
            {listError}
          </p>
        ) : null}
        {loading ? (
          <p className="text-sm text-zinc-400">Chargement…</p>
        ) : list.length === 0 && !listError ? (
          <p className="text-sm text-zinc-400">Aucun établissement pour l’instant.</p>
        ) : list.length === 0 ? null : (
          <ul className="space-y-2">
            {list.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-800/15 bg-[#C5F985] px-4 py-3 text-sm shadow-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">{e.name}</p>
                  <p className="font-mono text-xs text-zinc-700">{e.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-zinc-700">
                    {e._count.groups} groupe{e._count.groups !== 1 ? "s" : ""}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-900/25 bg-white/60 text-zinc-900 hover:bg-white hover:text-zinc-900"
                    asChild
                  >
                    <Link href={`/platform/establishments/${e.id}`}>Gérer</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
