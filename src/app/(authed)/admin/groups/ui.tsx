"use client";

import { useMemo, useState } from "react";
import { GraduationCap, School, Target, Trash2, Upload } from "lucide-react";
import { CsvImportZone } from "@/components/admin/CsvImportZone";
import { DashboardFoldOverlay } from "@/components/dashboard/DashboardFoldOverlay";
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
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

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
  level: SchoolLevel;
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
  const [classLevel, setClassLevel] = useState<SchoolLevel>("PRIMAIRE");
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
    for (const bucket of map.values()) {
      bucket.groups.sort((a, b) => {
        // Primaire en haut, Maternelle en bas
        if (a.level !== b.level) {
          return a.level === "PRIMAIRE" ? -1 : 1;
        }
        return a.name.localeCompare(b.name, "fr");
      });
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
          level: x.level === "MATERNELLE" ? "MATERNELLE" : "PRIMAIRE",
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
        body: JSON.stringify({ name: className, schoolId, level: classLevel }),
      });
      if (!res.ok) {
        setError("Impossible d’ajouter la classe (doublon dans cette école ?)");
        return;
      }
      setClassName("");
      setClassLevel("PRIMAIRE");
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
              className="text-xl md:text-2xl lg:text-3xl"
            />
          </div>
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-4xl">
          Préparez votre établissement
          <span className="mt-1 block text-emerald-600">en toute simplicité.</span>
        </h2>
        <p className="w-full text-base leading-relaxed text-zinc-700 sm:text-lg">
          Cette page prépare la structure de votre établissement :{" "}
          <strong className="font-semibold text-zinc-900">écoles</strong> et{" "}
          <strong className="font-semibold text-zinc-900">classes</strong> utilisées ensuite dans
          le service cantine (compteurs par groupe). Importez un CSV pour aller vite, ou ajoutez
          une école puis une classe à la main. Les{" "}
          <strong className="font-semibold text-zinc-900">objectifs par défaut</strong>
          {" "}
          s’appliquent à toutes les classes ; le bouton{" "}
          <strong className="font-semibold text-zinc-900">Objectifs</strong>{" "}
          sur chaque carte permet une cible propre à la classe.
        </p>
      </div>

      <div className="space-y-3">
        <DashboardFoldOverlay
          kicker="Import CSV"
          openLabel="Ouvrir Importer vos classes"
          overlayTitle="Importer vos classes"
          subtitle="Ajoutez rapidement votre structure avec un fichier CSV."
          hint="Colonnes attendues : ecole, classe, niveau. Téléchargez un exemple, puis importez."
          icon={Upload}
          labelledBy="admin-groups-import-overlay"
          closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        >
          <CsvImportZone
            title="Importer vos classes"
            description="Déposez votre fichier CSV ici, ou cliquez pour parcourir votre ordinateur."
            columns={["ecole", "classe", "niveau"]}
            exampleHref="/test-import-classes.csv"
            exampleLabel="Télécharger un exemple CSV"
            busy={busy}
            embedded
            resultMessage={
              importResult
                ? `${importResult.groupsCreated} classe${importResult.groupsCreated > 1 ? "s" : ""} ajoutée${importResult.groupsCreated > 1 ? "s" : ""}, ${importResult.schoolsCreated} école${importResult.schoolsCreated > 1 ? "s" : ""} créée${importResult.schoolsCreated > 1 ? "s" : ""}, ${importResult.groupsSkipped} ignorée${importResult.groupsSkipped > 1 ? "s" : ""}.`
                : null
            }
            onImport={importCsvFile}
          />
        </DashboardFoldOverlay>

        <DashboardFoldOverlay
          kicker="Saisie manuelle"
          openLabel="Ouvrir Ajouter une école ou une classe"
          overlayTitle="Ajouter une école ou une classe"
          subtitle="Créez une école, puis rattachez-y une classe en maternelle ou en primaire."
          hint="Les deux saisies sont sur la même page : école à gauche, classe à droite."
          icon={School}
          labelledBy="admin-groups-manual-overlay"
          closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        >
          <div className="grid gap-6 p-1 lg:grid-cols-2 sm:p-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
                <School className="size-3.5" aria-hidden />
                Ajouter une école manuellement
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-700">
                Un nom suffit. Vous pourrez ajouter les classes juste après.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void createSchool();
                }}
                className="mt-4 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-zinc-900"
                  placeholder="Ex: École Anne Frank"
                />
                <button
                  type="submit"
                  disabled={busy || newSchoolName.trim().length === 0}
                  className="rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  Ajouter
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
                <GraduationCap className="size-3.5" aria-hidden />
                Ajouter une classe manuellement
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-700">
                Choisissez l’école, le niveau, puis le nom de la classe.
              </p>
              <form onSubmit={createGroup} className="mt-4 flex flex-col gap-3">
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-zinc-900"
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
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value as SchoolLevel)}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-zinc-900"
                >
                  <option value="PRIMAIRE">Primaire</option>
                  <option value="MATERNELLE">Maternelle</option>
                </select>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-zinc-900"
                    placeholder="Ex: CE1 B"
                  />
                  <button
                    disabled={busy || className.trim().length === 0 || !schoolId}
                    className="rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {busy ? "..." : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </DashboardFoldOverlay>

        <DashboardFoldOverlay
          kicker="Objectifs"
          openLabel="Ouvrir Défauts objectifs (établissement)"
          overlayTitle="Défauts objectifs (établissement)"
          subtitle="Cibles Cantine+ pour toutes les classes : restes d’assiettes en %, pas les grammes du mode anti-gaspillage."
          hint="Choisissez une période, enregistrez, puis affinez une classe avec le bouton Objectifs sur sa carte."
          icon={Target}
          labelledBy="admin-groups-eco-defaults-overlay"
          closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        >
          <EstablishmentEcoObjectivesForm
            embedded
            initialRestes={establishmentEco.ecoRestesServisTargetPct}
            initialReduction={establishmentEco.ecoReductionTargetPct}
            initialPeriod={establishmentEco.ecoPeriodKind}
            initialSchoolMonth={establishmentEco.ecoSchoolYearStartMonth}
            initialSchoolDay={establishmentEco.ecoSchoolYearStartDay}
          />
        </DashboardFoldOverlay>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <DashboardFoldOverlay
        kicker="Classes"
        openLabel="Ouvrir Écoles et classes"
        overlayTitle="Écoles et classes"
        subtitle="Pour des cibles différentes par classe, utilisez le bouton Objectifs sur chaque carte. Laissez les champs vides pour reprendre les défauts établissement."
        hint={`${schools.length} école${schools.length > 1 ? "s" : ""} · ${activeCount} classe${activeCount > 1 ? "s" : ""} active${activeCount > 1 ? "s" : ""}. Vert = primaire, bleu = maternelle.`}
        icon={GraduationCap}
        labelledBy="admin-groups-list-overlay"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        bodyClassName="overflow-y-scroll pr-1.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-100"
      >
      {groupsBySchool.length === 0 ? (
        <p className="px-3 py-10 text-center text-base font-bold leading-relaxed text-zinc-900 sm:text-lg">
          Aucune classe. Importez un CSV ou ajoutez une école puis une classe.
        </p>
      ) : (
        <div className="space-y-5 p-1 sm:p-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-base font-bold text-zinc-950">
              {schools.length} école{schools.length > 1 ? "s" : ""} ·{" "}
              <span className="font-extrabold">{activeCount}</span> classe
              {activeCount > 1 ? "s" : ""} active{activeCount > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-semibold text-zinc-800">
              <span className="font-extrabold text-zinc-950">Légende :</span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-sm border border-emerald-300 bg-emerald-100"
                  aria-hidden
                />
                Vert = Primaire
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-sm border border-sky-300 bg-sky-100"
                  aria-hidden
                />
                Bleu = Maternelle
              </span>
            </div>
          </div>
          <div>
          {groupsBySchool.map(([sid, bucket]) => (
          <section key={sid} className="space-y-3 pb-6 last:pb-0">
            <h2 className="sticky top-0 z-10 bg-white/90 py-1 text-lg font-semibold text-zinc-900 backdrop-blur-sm">
              {bucket.schoolName}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {bucket.groups.map((g) => (
                <div
                  key={g.id}
                  className={[
                    "rounded-2xl border p-4",
                    g.level === "MATERNELLE"
                      ? "border-sky-300 bg-sky-100"
                      : "border-emerald-300 bg-emerald-100",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <GroupNameBadge name={g.name} variant="plain" />
                      <p
                        className={[
                          "text-xs font-semibold",
                          g.level === "MATERNELLE" ? "text-sky-800" : "text-emerald-800",
                        ].join(" ")}
                      >
                        {schoolLevelLabelFr(g.level)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={g.level}
                        aria-label={`Niveau de ${g.name}`}
                        onChange={(e) => {
                          const level = e.target.value as SchoolLevel;
                          setGroups((all) =>
                            all.map((x) => (x.id === g.id ? { ...x, level } : x)),
                          );
                          void fetch(`/api/groups/${g.id}`, {
                            method: "PATCH",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ level }),
                          }).then((res) => {
                            if (!res.ok) void refresh();
                          });
                        }}
                        className="rounded-lg border border-white/80 bg-white/80 px-2 py-1 text-xs font-medium text-zinc-700"
                      >
                        <option value="PRIMAIRE">Primaire</option>
                        <option value="MATERNELLE">Maternelle</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => toggleActive(g)}
                        className={[
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          g.active
                            ? "bg-white/90 text-emerald-800"
                            : "bg-white/70 text-zinc-700",
                        ].join(" ")}
                      >
                        {g.active ? "Actif" : "Inactif"}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-zinc-700 hover:text-destructive"
                        aria-label={`Supprimer ${g.schoolName} ${g.name}`}
                        onClick={() => setToDelete(g)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div
                    className={[
                      "mt-3 flex flex-wrap items-center gap-2 border-t pt-3",
                      g.level === "MATERNELLE" ? "border-sky-200/80" : "border-emerald-200/80",
                    ].join(" ")}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-white/80 bg-white/80 font-medium"
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
        ))}
          </div>
        </div>
      )}
      </DashboardFoldOverlay>

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
