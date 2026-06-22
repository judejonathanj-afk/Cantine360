"use client";

import { useMemo, useState } from "react";
import { Trash2, Target } from "lucide-react";
import { CsvImportZone } from "@/components/admin/CsvImportZone";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
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

type School = {
  id: string;
  name: string;
  active: boolean;
  groupCount: number;
};

type Group = {
  id: string;
  name: string;
  active: boolean;
  schoolId: string;
  schoolName: string;
  ecoRestesServisTargetPct: number | null;
  ecoReductionTargetPct: number | null;
};

type ImportResult = {
  schoolsCreated: number;
  groupsCreated: number;
  groupsSkipped: number;
  importedRows: number;
  parseErrors: string[];
  errors: string[];
};

export function AdminGroupsClient({
  initialGroups,
  initialSchools,
  establishmentEco,
}: {
  initialGroups: Group[];
  initialSchools: School[];
  establishmentEco: EstablishmentEcoSettings;
}) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [className, setClassName] = useState("");
  const [schoolId, setSchoolId] = useState(initialSchools[0]?.id ?? "");
  const [newSchoolName, setNewSchoolName] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Group | null>(null);
  const [ecoGroup, setEcoGroup] = useState<Group | null>(null);
  const [ecoOpen, setEcoOpen] = useState(false);

  const activeCount = useMemo(
    () => groups.filter((g) => g.active).length,
    [groups],
  );

  const groupsBySchool = useMemo(() => {
    const map = new Map<string, { schoolName: string; groups: Group[] }>();
    for (const g of groups) {
      const bucket = map.get(g.schoolId) ?? { schoolName: g.schoolName, groups: [] };
      bucket.groups.push(g);
      map.set(g.schoolId, bucket);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[1].schoolName.localeCompare(b[1].schoolName, "fr"),
    );
  }, [groups]);

  async function refresh() {
    const [groupsRes, schoolsRes] = await Promise.all([
      fetch("/api/groups"),
      fetch("/api/schools"),
    ]);
    if (groupsRes.ok) {
      const data = (await groupsRes.json()) as { groups: Record<string, unknown>[] };
      setGroups(
        data.groups.map((x) => ({
          id: String(x.id),
          name: String(x.name),
          active: Boolean(x.active),
          schoolId: String(x.schoolId),
          schoolName: String(x.schoolName),
          ecoRestesServisTargetPct:
            typeof x.ecoRestesServisTargetPct === "number" ? x.ecoRestesServisTargetPct : null,
          ecoReductionTargetPct:
            typeof x.ecoReductionTargetPct === "number" ? x.ecoReductionTargetPct : null,
        })),
      );
    }
    if (schoolsRes.ok) {
      const data = (await schoolsRes.json()) as { schools: School[] };
      setSchools(data.schools);
      if (!schoolId && data.schools[0]) setSchoolId(data.schools[0].id);
    }
  }

  async function createSchool() {
    const name = newSchoolName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setError("Impossible d’ajouter l’école (nom en double ?)");
        return;
      }
      setNewSchoolName("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) {
      setError("Choisissez ou créez une école avant d’ajouter une classe.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: className, schoolId }),
      });
      if (!res.ok) {
        setError("Impossible d’ajouter la classe (doublon dans cette école ?)");
        return;
      }
      setClassName("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function importCsvFile(file: File): Promise<boolean> {
    setBusy(true);
    setError(null);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/groups/import", { method: "POST", body: form });
      const data = (await res.json()) as ImportResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Import impossible");
        if (data.parseErrors?.length) setImportResult(data);
        return false;
      }
      setImportResult(data);
      await refresh();
      return true;
    } catch {
      setError("Erreur réseau lors de l’import.");
      return false;
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
        setError("Impossible de supprimer cette classe.");
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
      <div className="w-full space-y-3">
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 shadow-lg md:rounded-2xl md:px-7 md:py-3">
            <MenusCantineColorTitle
              text="ÉCOLES & CLASSES"
              className="text-2xl md:text-3xl lg:text-4xl"
            />
          </div>
        </div>
        <p className="w-full text-base font-semibold text-zinc-900 sm:text-lg">
          {schools.length} école{schools.length > 1 ? "s" : ""} ·{" "}
          <span className="font-bold">{activeCount}</span> classe{activeCount > 1 ? "s" : ""}{" "}
          active{activeCount > 1 ? "s" : ""}
        </p>
        <p className="w-full text-base leading-relaxed text-zinc-700 sm:text-lg">
          Cette page prépare la structure de votre établissement :{" "}
          <strong className="font-semibold text-zinc-900">écoles</strong> et{" "}
          <strong className="font-semibold text-zinc-900">classes</strong> utilisées ensuite dans
          le service cantine (compteurs par groupe). Importez un CSV pour aller vite, ou ajoutez
          une école puis une classe à la main. Les{" "}
          <strong className="font-semibold text-zinc-900">objectifs par défaut</strong> s&apos;appliquent
          à toutes les classes ; le bouton <strong className="font-semibold text-zinc-900">Objectifs</strong>{" "}
          sur chaque carte permet une cible propre à la classe.
        </p>
      </div>

      <CsvImportZone
        onColor
        title="Importer des classes (CSV)"
        description={
          <>
            Colonnes <code className="rounded bg-white/15 px-1 text-white/90">ecole</code> et{" "}
            <code className="rounded bg-white/15 px-1 text-white/90">classe</code>, séparateur
            point-virgule. Les écoles sont créées automatiquement si besoin.
          </>
        }
        exampleHref="/test-import-classes.csv"
        exampleLabel="Télécharger un exemple CSV (15 classes)"
        busy={busy}
        resultMessage={
          importResult
            ? `${importResult.groupsCreated} classe${importResult.groupsCreated > 1 ? "s" : ""} ajoutée${importResult.groupsCreated > 1 ? "s" : ""}, ${importResult.schoolsCreated} école${importResult.schoolsCreated > 1 ? "s" : ""} créée${importResult.schoolsCreated > 1 ? "s" : ""}, ${importResult.groupsSkipped} ignorée${importResult.groupsSkipped > 1 ? "s" : ""}.`
            : null
        }
        onImport={importCsvFile}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createSchool();
          }}
          className="rounded-2xl border-2 border-zinc-900 bg-white p-4"
        >
          <div className="text-sm font-medium text-zinc-900">Ajouter une école manuellement</div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
              placeholder="Ex: École Anne Frank"
            />
            <button
              type="submit"
              disabled={busy || newSchoolName.trim().length === 0}
              className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </form>

        <form
          onSubmit={createGroup}
          className="rounded-2xl border-2 border-zinc-900 bg-white p-4"
        >
          <div className="text-sm font-medium text-zinc-900">Ajouter une classe manuellement</div>
          <div className="mt-3 flex flex-col gap-3">
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
            >
              {schools.length === 0 ? (
                <option value="">Créez d’abord une école</option>
              ) : (
                schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
                placeholder="Ex: CE1 B"
              />
              <button
                disabled={busy || className.trim().length === 0 || !schoolId}
                className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "..." : "Ajouter"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <EstablishmentEcoObjectivesForm
        initialRestes={establishmentEco.ecoRestesServisTargetPct}
        initialReduction={establishmentEco.ecoReductionTargetPct}
        initialPeriod={establishmentEco.ecoPeriodKind}
        initialSchoolMonth={establishmentEco.ecoSchoolYearStartMonth}
        initialSchoolDay={establishmentEco.ecoSchoolYearStartDay}
      />

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <p className="text-sm leading-relaxed text-zinc-600">
        Pour des cibles différentes par classe, utilisez le bouton <strong className="text-zinc-900">Objectifs</strong>{" "}
        sur chaque carte. Laissez les champs vides pour reprendre les défauts établissement.
      </p>

      {groupsBySchool.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
          Aucune classe. Importez un CSV ou ajoutez une école puis une classe.
        </div>
      ) : (
        groupsBySchool.map(([sid, bucket]) => (
          <section key={sid} className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">{bucket.schoolName}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bucket.groups.map((g) => (
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
                        aria-label={`Supprimer ${g.schoolName} ${g.name}`}
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
          </section>
        ))
      )}

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
            <AlertDialogTitle>Supprimer cette classe ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {toDelete?.schoolName} — {toDelete?.name} » sera retirée. Les compteurs déjà saisis
              pour cette classe sur les services passés seront aussi supprimés (cascade).
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
