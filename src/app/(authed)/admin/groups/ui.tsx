"use client";

import { useMemo, useState } from "react";
import { Trash2, Target } from "lucide-react";
import { GroupNameBadge } from "@/components/GroupNameBadge";
import { EstablishmentEcoObjectivesForm } from "@/components/EstablishmentEcoObjectivesForm";
import { GroupEcoObjectivesDialog } from "./GroupEcoObjectivesDialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EstablishmentEcoSettings } from "@/server/establishmentEco";

type Group = {
  id: string;
  name: string;
  active: boolean;
  ecoRestesServisTargetPct: number | null;
  ecoReductionTargetPct: number | null;
};

export function AdminGroupsClient({
  initialGroups,
  establishmentEco,
}: {
  initialGroups: Group[];
  establishmentEco: EstablishmentEcoSettings;
}) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Group | null>(null);
  const [ecoGroup, setEcoGroup] = useState<Group | null>(null);
  const [ecoOpen, setEcoOpen] = useState(false);

  const activeCount = useMemo(
    () => groups.filter((g) => g.active).length,
    [groups],
  );

  async function refresh() {
    const res = await fetch("/api/groups");
    if (!res.ok) return;
    const data = (await res.json()) as { groups: Record<string, unknown>[] };
    setGroups(
      data.groups.map((x) => ({
        id: String(x.id),
        name: String(x.name),
        active: Boolean(x.active),
        ecoRestesServisTargetPct:
          typeof x.ecoRestesServisTargetPct === "number" ? x.ecoRestesServisTargetPct : null,
        ecoReductionTargetPct:
          typeof x.ecoReductionTargetPct === "number" ? x.ecoReductionTargetPct : null,
      })),
    );
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setError("Impossible d’ajouter le groupe (nom en double ?)");
        return;
      }
      setName("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(g: Group) {
    setGroups((all) =>
      all.map((x) => (x.id === g.id ? { ...x, active: !x.active } : x)),
    );
    const res = await fetch(`/api/groups/${g.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !g.active }),
    });
    if (!res.ok) await refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${toDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Impossible de supprimer ce groupe.");
        return;
      }
      setToDelete(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Groupes</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Groupes actifs: <span className="font-semibold">{activeCount}</span>
        </p>
      </div>

      <form
        onSubmit={createGroup}
        className="rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <div className="text-sm font-medium text-zinc-900">
          Ajouter un groupe
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
            placeholder="Ex: CP, CE1, 6eA…"
          />
          <button
            disabled={busy || name.trim().length === 0}
            className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "..." : "Ajouter"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </form>

      <p className="text-sm leading-relaxed text-zinc-600">
        Pour des cibles différentes par classe, utilisez le bouton <strong className="text-zinc-900">Objectifs</strong>{" "}
        sur chaque carte de groupe. Laissez les champs vides dans la fenêtre pour reprendre les défauts établissement
        (bloc <strong className="text-zinc-900">Défauts objectifs</strong> en bas de page).
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div
            key={g.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <GroupNameBadge name={g.name} variant="plain" />
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(g)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    g.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-700",
                  ].join(" ")}
                >
                  {g.active ? "Actif" : "Inactif"}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                  aria-label={`Supprimer ${g.name}`}
                  onClick={() => setToDelete(g)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 font-medium"
                onClick={() => {
                  setEcoGroup(g);
                  setEcoOpen(true);
                }}
              >
                <Target className="h-4 w-4 shrink-0" aria-hidden />
                Objectifs
              </Button>
            </div>
          </div>
        ))}
      </div>

      <EstablishmentEcoObjectivesForm
        initialRestes={establishmentEco.ecoRestesServisTargetPct}
        initialReduction={establishmentEco.ecoReductionTargetPct}
        initialPeriod={establishmentEco.ecoPeriodKind}
        initialSchoolMonth={establishmentEco.ecoSchoolYearStartMonth}
        initialSchoolDay={establishmentEco.ecoSchoolYearStartDay}
      />

      <GroupEcoObjectivesDialog
        group={ecoGroup}
        establishmentEco={establishmentEco}
        open={ecoOpen}
        onOpenChange={(o) => {
          setEcoOpen(o);
          if (!o) setEcoGroup(null);
        }}
        onSaved={() => void refresh()}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce groupe ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.name} » sera retiré. Les compteurs déjà saisis pour ce groupe sur
              les services passés seront aussi supprimés (cascade).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "…" : "Supprimer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

