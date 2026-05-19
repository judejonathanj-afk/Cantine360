"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { randomEstablishmentPin } from "@/lib/platformPins";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        if (cancelled) return;
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
    setAdminPin(randomEstablishmentPin());
    setKitchenPin(randomEstablishmentPin());
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <p className="text-sm text-destructive">Établissement introuvable.</p>
        <Button variant="outline" asChild>
          <Link href="/platform/establishments">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <Link
        href="/platform/establishments"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour à la liste
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{detail.name}</h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">{detail.slug}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {detail._count.groups} groupe{detail._count.groups !== 1 ? "s" : ""} ·{" "}
          {detail._count.services} service{detail._count.services !== 1 ? "s" : ""} enregistré
          {detail._count.services !== 1 ? "s" : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifier l’établissement</CardTitle>
          <CardDescription>
            Nom et code de connexion. Cochez « nouveau code » pour réinitialiser admin ou cuisine,
            puis enregistrez et remettez les codes sur place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Code établissement (connexion /login)</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="font-mono text-sm lowercase"
                required
              />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Si vous changez ce code, l’ancien ne fonctionnera plus à la connexion.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Codes d’accès</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={resetBothPins}>
                  Regénérer admin + cuisine
                </Button>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={changeAdminPin}
                  onChange={(e) => {
                    setChangeAdminPin(e.target.checked);
                    if (e.target.checked && !adminPin) setAdminPin(randomEstablishmentPin());
                  }}
                />
                <span className="flex-1 space-y-2">
                  <span className="block text-sm font-medium">Nouveau code admin</span>
                  {changeAdminPin ? (
                    <Input
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      inputMode="numeric"
                      className="font-mono tracking-widest"
                      required
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Inchangé — cochez pour en définir un nouveau.
                    </span>
                  )}
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={changeKitchenPin}
                  onChange={(e) => {
                    setChangeKitchenPin(e.target.checked);
                    if (e.target.checked && !kitchenPin) setKitchenPin(randomEstablishmentPin());
                  }}
                />
                <span className="flex-1 space-y-2">
                  <span className="block text-sm font-medium">Nouveau code cuisine</span>
                  {changeKitchenPin ? (
                    <Input
                      value={kitchenPin}
                      onChange={(e) => setKitchenPin(e.target.value)}
                      inputMode="numeric"
                      className="font-mono tracking-widest"
                      required
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Inchangé — cochez pour en définir un nouveau.
                    </span>
                  )}
                </span>
              </label>
            </div>

            {error ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                {info}
              </p>
            ) : null}

            <Button type="submit" disabled={busy}>
              {busy ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {saved ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Codes mis à jour — à remettre</CardTitle>
            <CardDescription>
              Seuls les codes modifiés sont listés. Les postes déjà connectés sont déconnectés
              automatiquement. Pour tester : ouvrez une fenêtre privée sur /login — le code
              cuisine et le code admin sont différents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm">
            <p>
              <span className="text-muted-foreground">Code établissement :</span> {saved.slug}
            </p>
            {saved.adminPin !== undefined ? (
              <p>
                <span className="text-muted-foreground">Nouveau code admin :</span>{" "}
                {saved.adminPin}
              </p>
            ) : null}
            {saved.kitchenPin !== undefined ? (
              <p>
                <span className="text-muted-foreground">Nouveau code cuisine :</span>{" "}
                {saved.kitchenPin}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
