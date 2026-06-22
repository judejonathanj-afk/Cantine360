"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { CsvImportZone } from "@/components/admin/CsvImportZone";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { EU14_ALLERGENS, type AllergenLabel } from "@/lib/allergens";
import { formatGroupLabel } from "@/lib/groupLabel";
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

type Group = {
  id: string;
  name: string;
  schoolName: string;
  active: boolean;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  allergens: string[];
  active: boolean;
  groupId: string;
  className: string;
  schoolName: string;
};

type ImportResult = {
  studentsCreated: number;
  studentsUpdated: number;
  studentsSkipped: number;
  importedRows: number;
  parseErrors: string[];
  errors: string[];
};

export function AdminStudentsClient({
  initialStudents,
  groups,
}: {
  initialStudents: Student[];
  groups: Group[];
  }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [groupId, setGroupId] = useState(groups.find((g) => g.active)?.id ?? "");
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenLabel[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Student | null>(null);

  const activeGroups = useMemo(() => groups.filter((g) => g.active), [groups]);

  const withAllergens = useMemo(
    () => students.filter((s) => s.active && s.allergens.length > 0).length,
    [students],
  );

  const byClass = useMemo(() => {
    const map = new Map<string, { label: string; students: Student[] }>();
    for (const s of students) {
      const label = formatGroupLabel(s.schoolName, s.className);
      const bucket = map.get(s.groupId) ?? { label, students: [] };
      bucket.students.push(s);
      map.set(s.groupId, bucket);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[1].label.localeCompare(b[1].label, "fr"),
    );
  }, [students]);

  async function refresh() {
    const res = await fetch("/api/students");
    if (!res.ok) return;
    const data = (await res.json()) as { students: Student[] };
    setStudents(data.students);
  }

  async function importCsvFile(file: File): Promise<boolean> {
    setBusy(true);
    setError(null);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/students/import", { method: "POST", body: form });
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

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!groupId) {
      setError("Choisissez une classe.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          groupId,
          allergens: selectedAllergens,
        }),
      });
      if (!res.ok) {
        setError("Impossible d’ajouter cet élève (doublon ?)");
        return;
      }
      setFirstName("");
      setLastName("");
      setSelectedAllergens([]);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(s: Student) {
    setStudents((all) =>
      all.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)),
    );
    const res = await fetch(`/api/students/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    if (!res.ok) await refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${toDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Impossible de supprimer cet élève.");
        return;
      }
      setToDelete(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function toggleAllergen(a: AllergenLabel) {
    setSelectedAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  }

  return (
    <div className="space-y-6">
      <div className="w-full space-y-3">
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 shadow-lg md:rounded-2xl md:px-7 md:py-3">
            <MenusCantineColorTitle
              text="ÉLÈVES & ALLERGÈNES"
              className="text-2xl md:text-3xl lg:text-4xl"
            />
          </div>
        </div>
        <p className="w-full text-base font-semibold text-zinc-900 sm:text-lg">
          {students.length} élève{students.length > 1 ? "s" : ""} ·{" "}
          <span className="font-bold">{withAllergens}</span> avec allergène
          {withAllergens > 1 ? "s" : ""} déclaré{withAllergens > 1 ? "s" : ""}
        </p>
        <p className="w-full text-base leading-relaxed text-zinc-700 sm:text-lg">
          Cette page enregistre la liste des <strong className="font-semibold text-zinc-900">élèves</strong>{" "}
          et leurs <strong className="font-semibold text-zinc-900">allergènes</strong> par classe.
          Importez un CSV (après avoir créé les classes) ou ajoutez un élève à la main. Ces données
          alimentent ensuite le service cantine : alertes sur le menu du jour et liste nominative
          des élèves concernés.
        </p>
      </div>

      <CsvImportZone
        onColor
        title="Importer des élèves (CSV)"
        description={
          <>
            Colonnes <code className="rounded bg-white/15 px-1 text-white/90">ecole</code>,{" "}
            <code className="rounded bg-white/15 px-1 text-white/90">classe</code>,{" "}
            <code className="rounded bg-white/15 px-1 text-white/90">prenom</code>,{" "}
            <code className="rounded bg-white/15 px-1 text-white/90">nom</code>,{" "}
            <code className="rounded bg-white/15 px-1 text-white/90">allergenes</code>. Importez
            d’abord les classes.
          </>
        }
        exampleHref="/test-import-eleves.csv"
        exampleLabel="Télécharger un exemple CSV (34 élèves)"
        busy={busy}
        resultMessage={
          importResult
            ? `${importResult.studentsCreated} créé${importResult.studentsCreated > 1 ? "s" : ""}, ${importResult.studentsUpdated} mis à jour, ${importResult.studentsSkipped} ignoré${importResult.studentsSkipped > 1 ? "s" : ""}.`
            : null
        }
        onImport={importCsvFile}
      />

      <form
        onSubmit={createStudent}
        className="rounded-2xl border-2 border-zinc-900 bg-white p-4"
      >
        <div className="text-sm font-medium text-zinc-900">Ajouter un élève</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
            placeholder="Prénom"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
            placeholder="Nom"
          />
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900 sm:col-span-2"
          >
            {activeGroups.length === 0 ? (
              <option value="">Aucune classe active</option>
            ) : (
              activeGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {formatGroupLabel(g.schoolName, g.name)}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="mt-3">
          <div className="text-xs font-medium text-zinc-700">Allergènes</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {EU14_ALLERGENS.map((a) => {
              const on = selectedAllergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    on ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700",
                  ].join(" ")}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="submit"
          disabled={busy || !firstName.trim() || !lastName.trim() || !groupId}
          className="mt-4 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Ajouter l’élève
        </button>
      </form>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {byClass.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
          Aucun élève. Importez un CSV ou ajoutez un élève manuellement.
        </div>
      ) : (
        byClass.map(([gid, bucket]) => (
          <section key={gid} className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">{bucket.label}</h2>
            <p className="text-xs text-zinc-500">
              {bucket.students.filter((s) => s.allergens.length > 0).length} allergie
              {bucket.students.filter((s) => s.allergens.length > 0).length > 1 ? "s" : ""}{" "}
              sur {bucket.students.length} élève
              {bucket.students.length > 1 ? "s" : ""}
            </p>
            <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
              {bucket.students.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-900">
                      {s.firstName} {s.lastName}
                      {!s.active ? (
                        <span className="ml-2 text-xs font-medium text-zinc-500">(inactif)</span>
                      ) : null}
                    </div>
                    {s.allergens.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {s.allergens.map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-500">Aucun allergène déclaré</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(s)}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        s.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-700",
                      ].join(" ")}
                    >
                      {s.active ? "Actif" : "Inactif"}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      aria-label={`Supprimer ${s.firstName} ${s.lastName}`}
                      onClick={() => setToDelete(s)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet élève ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.firstName} {toDelete?.lastName} sera retiré de la liste.
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
