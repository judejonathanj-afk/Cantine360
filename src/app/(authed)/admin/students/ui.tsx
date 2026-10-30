"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { CsvImportZone } from "@/components/admin/CsvImportZone";
import { DashboardFoldOverlay } from "@/components/dashboard/DashboardFoldOverlay";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { EU14_ALLERGENS, type AllergenLabel } from "@/lib/allergens";
import { formatGroupLabel } from "@/lib/groupLabel";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  level?: SchoolLevel;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  allergens: string[];
  allergenNotes: string | null;
  noPork: boolean;
  vegetarian: boolean;
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
  const [allergenNotes, setAllergenNotes] = useState("");
  const [noPork, setNoPork] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [addAllergenOpen, setAddAllergenOpen] = useState(false);
  const [addRegimeOpen, setAddRegimeOpen] = useState(false);

  const activeGroups = useMemo(() => groups.filter((g) => g.active), [groups]);
  const groupLevelById = useMemo(() => {
    const map = new Map<string, SchoolLevel>();
    for (const g of groups) {
      map.set(g.id, g.level ?? "PRIMAIRE");
    }
    return map;
  }, [groups]);
  const withAllergens = students.filter((s) => s.active && s.allergens.length > 0).length;
  const noPorkCount = students.filter((s) => s.active && s.noPork).length;
  const vegetarianCount = students.filter((s) => s.active && s.vegetarian).length;

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
          allergenNotes: allergenNotes.trim() || null,
          noPork,
          vegetarian,
        }),
      });
      if (!res.ok) {
        setError("Impossible d’ajouter cet élève (doublon ?)");
        return;
      }
      setFirstName("");
      setLastName("");
      setSelectedAllergens([]);
      setAllergenNotes("");
      setNoPork(false);
      setVegetarian(false);
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

  async function saveAllergenNotes(s: Student, notes: string) {
    const next = notes.trim() || null;
    if ((s.allergenNotes ?? null) === next) return;
    setStudents((all) =>
      all.map((x) => (x.id === s.id ? { ...x, allergenNotes: next } : x)),
    );
    const res = await fetch(`/api/students/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ allergenNotes: next }),
    });
    if (!res.ok) await refresh();
  }

  async function setAllergens(s: Student, allergens: string[]) {
    setStudents((all) =>
      all.map((x) => (x.id === s.id ? { ...x, allergens } : x)),
    );
    const res = await fetch(`/api/students/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ allergens }),
    });
    if (!res.ok) await refresh();
  }

  async function toggleDiet(s: Student, field: "noPork" | "vegetarian") {
    const next = !s[field];
    setStudents((all) =>
      all.map((x) => (x.id === s.id ? { ...x, [field]: next } : x)),
    );
    const res = await fetch(`/api/students/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [field]: next }),
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
      if (openStudentId === toDelete.id) setOpenStudentId(null);
      setToDelete(null);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const openStudent =
    students.find((s) => s.id === openStudentId) ?? null;
  const openLevel = openStudent
    ? (groupLevelById.get(openStudent.groupId) ?? "PRIMAIRE")
    : "PRIMAIRE";

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
              className="text-xl md:text-2xl lg:text-3xl"
            />
          </div>
        </div>
        <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-4xl">
          Préparez vos élèves
          <span className="mt-1 block text-emerald-600">en toute simplicité.</span>
        </h2>
        <p className="w-full text-base font-semibold text-zinc-900 sm:text-lg">
          {students.length} élève{students.length > 1 ? "s" : ""} ·{" "}
          <span className="font-bold">{withAllergens}</span> avec allergène
          {withAllergens > 1 ? "s" : ""} déclaré{withAllergens > 1 ? "s" : ""} ·{" "}
          <span className="font-bold">{noPorkCount}</span> sans porc ·{" "}
          <span className="font-bold">{vegetarianCount}</span> végétarien
          {vegetarianCount > 1 ? "s" : ""}
        </p>
        <p className="w-full text-base leading-relaxed text-zinc-700 sm:text-lg">
          Cette page enregistre la liste des <strong className="font-semibold text-zinc-900">élèves</strong>
          , leurs <strong className="font-semibold text-zinc-900">allergènes</strong> et les
          régimes <strong className="font-semibold text-zinc-900">sans porc / végétarien</strong>{" "}
          (hors allergie). Importez un CSV (après avoir créé les classes) ou ajoutez un élève à
          la main. Ces données alimentent ensuite le service cantine : alertes sur le menu du
          jour et liste nominative des élèves concernés.
        </p>
      </div>

      <DashboardFoldOverlay
        kicker="Élèves"
        openLabel="Ouvrir Importer ou ajouter un élève"
        overlayTitle="Importer ou ajouter un élève"
        subtitle="Importez un CSV ou saisissez un élève à la main, avec allergènes et régimes."
        hint="Les classes doivent déjà exister. Ces données alimentent le service cantine."
        icon={UserPlus}
        labelledBy="admin-students-import-overlay"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
      >
        <div className="grid gap-6 p-1 lg:grid-cols-2 sm:p-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
              <Upload className="size-3.5" aria-hidden />
              Importer vos élèves
            </p>
            <CsvImportZone
              title="Importer vos élèves"
              description="Ajoutez rapidement vos élèves avec un fichier CSV."
              columns={[
                "ecole",
                "classe",
                "prenom",
                "nom",
                "allergenes",
                "consignes",
                "sans_porc",
                "vegetarien",
              ]}
              exampleHref="/test-import-eleves.csv"
              exampleLabel="Télécharger un exemple CSV"
              busy={busy}
              embedded
              resultMessage={
                importResult
                  ? `${importResult.studentsCreated} créé${importResult.studentsCreated > 1 ? "s" : ""}, ${importResult.studentsUpdated} mis à jour, ${importResult.studentsSkipped} ignoré${importResult.studentsSkipped > 1 ? "s" : ""}.`
                  : null
              }
              onImport={importCsvFile}
            />
          </div>

          <form
            onSubmit={createStudent}
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
          >
            <p className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
              <UserPlus className="size-3.5" aria-hidden />
              Ajouter un élève
            </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-bold text-zinc-950 outline-none placeholder:font-bold placeholder:text-zinc-700 focus:border-zinc-900"
            placeholder="Prénom"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-950 outline-none placeholder:font-semibold placeholder:text-zinc-700 focus:border-zinc-900"
            placeholder="Nom"
          />
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-900 sm:col-span-2"
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
        <div className="mt-2">
          <div className="text-sm font-bold text-zinc-950">Allergènes</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
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
        <div className="mt-2">
          <div className="text-sm font-bold text-zinc-950">Régimes (hors allergènes)</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setNoPork((v) => !v)}
              className={[
                "rounded-full px-2.5 py-1 text-sm font-bold",
                noPork ? "bg-sky-800 text-white" : "bg-zinc-100 text-zinc-800",
              ].join(" ")}
            >
              Sans porc
            </button>
            <button
              type="button"
              onClick={() => setVegetarian((v) => !v)}
              className={[
                "rounded-full px-2.5 py-1 text-sm font-bold",
                vegetarian ? "bg-emerald-800 text-white" : "bg-zinc-100 text-zinc-800",
              ].join(" ")}
            >
              Végétarien
            </button>
          </div>
        </div>
        <div className="mt-2">
          <label className="text-sm font-bold text-zinc-950" htmlFor="allergen-notes">
            Consignes parents (affichées en cuisine)
          </label>
          <textarea
            id="allergen-notes"
            value={allergenNotes}
            onChange={(e) => setAllergenNotes(e.target.value)}
            rows={2}
            maxLength={500}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-900"
            placeholder="Ex. : ne pas servir d’œufs même en trace ; pain sans gluten fourni par la famille…"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !firstName.trim() || !lastName.trim() || !groupId}
          className="mt-3 rounded-lg bg-emerald-900 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Ajouter l’élève
        </button>
          </form>
        </div>
      </DashboardFoldOverlay>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <DashboardFoldOverlay
        kicker="Liste"
        openLabel="Ouvrir Élèves et allergènes"
        overlayTitle="Élèves et allergènes"
        subtitle="Parcourez les élèves par classe : allergènes, régimes et consignes parents."
        hint="Survolez une carte pour l’agrandir, cliquez pour ouvrir la fiche de l’élève."
        icon={Users}
        labelledBy="admin-students-list-overlay"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        bodyClassName="overflow-y-scroll pr-1.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-100"
      >
      {byClass.length === 0 ? (
        <p className="px-3 py-10 text-center text-base font-bold leading-relaxed text-zinc-900 sm:text-lg">
          Aucun élève pour l’instant. Ouvrez l’import CSV ou ajoutez un élève à la
          main.
        </p>
      ) : (
        <div className="space-y-5 p-1 sm:p-2">
        {byClass.map(([gid, bucket]) => {
          const allergyN = bucket.students.filter((s) => s.allergens.length > 0).length;
          const porkN = bucket.students.filter((s) => s.noPork).length;
          const vegN = bucket.students.filter((s) => s.vegetarian).length;
          return (
          <section key={gid} className="space-y-3">
            <div className="rounded-2xl bg-emerald-800 px-4 py-3">
              <h2 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
                {bucket.label}
              </h2>
              <p className="mt-1 text-sm font-bold leading-snug text-emerald-50">
                {allergyN} allergie{allergyN > 1 ? "s" : ""} · {porkN} sans porc ·{" "}
                {vegN} végétarien{vegN > 1 ? "s" : ""} · {bucket.students.length}{" "}
                élève{bucket.students.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid gap-3 overflow-visible sm:grid-cols-2">
              {bucket.students.map((s) => {
                const level = groupLevelById.get(s.groupId) ?? "PRIMAIRE";
                const maternelle = level === "MATERNELLE";
                const cycleFill = maternelle
                  ? "bg-sky-400 text-sky-950"
                  : "bg-emerald-400 text-emerald-950";
                return (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenStudentId(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenStudentId(s.id);
                    }
                  }}
                  className={[
                    "relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-[28px] border-2 px-4 py-4 text-left shadow-sm transition duration-200 hover:z-10 hover:scale-[1.03] hover:shadow-lg motion-reduce:transform-none",
                    maternelle
                      ? "border-sky-200 bg-[#f4f9ff]"
                      : "border-emerald-200 bg-[#f3fbf6]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3 pr-24">
                    <div className="min-w-0 pt-0.5">
                      <p className="text-xl font-extrabold tracking-tight text-zinc-950">
                        {s.firstName} {s.lastName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${cycleFill}`}
                        >
                          {schoolLevelLabelFr(level)}
                        </span>
                        {s.className ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                              maternelle
                                ? "bg-sky-100 text-sky-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {s.className}
                          </span>
                        ) : null}
                        {s.schoolName ? (
                          <span className="text-xs font-semibold text-zinc-500">
                            {s.schoolName}
                          </span>
                        ) : null}
                        {!s.active ? (
                          <span className="text-xs font-bold text-zinc-600">
                            (inactif)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div
                    className="absolute right-3 top-3 flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                      <button
                        type="button"
                        onClick={() => toggleActive(s)}
                        className={[
                          "rounded-full px-3 py-1 text-sm font-extrabold",
                          s.active
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-200 text-zinc-800",
                        ].join(" ")}
                      >
                        {s.active ? "Actif" : "Inactif"}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-zinc-800 hover:text-destructive"
                        aria-label={`Supprimer ${s.firstName} ${s.lastName}`}
                        onClick={() => setToDelete(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  <div className="min-w-0 space-y-3">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-800">
                        Allergènes
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {s.allergens.length > 0 ? (
                        s.allergens.map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-amber-500 px-2.5 py-1 text-sm font-bold text-white"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm font-semibold text-zinc-600">
                          Aucun allergène déclaré
                        </span>
                      )}
                      </div>
                    </div>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-800">
                        Régimes
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void toggleDiet(s, "noPork")}
                        className={[
                          "rounded-full px-3 py-1 text-sm font-extrabold",
                          s.noPork
                            ? "bg-zinc-200 text-zinc-800"
                            : "bg-white text-zinc-500",
                        ].join(" ")}
                      >
                        Sans porc
                      </button>
                      <button
                        type="button"
                        onClick={() => void toggleDiet(s, "vegetarian")}
                        className={[
                          "rounded-full px-3 py-1 text-sm font-extrabold",
                          s.vegetarian
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-zinc-500",
                        ].join(" ")}
                      >
                        Végétarien
                      </button>
                      </div>
                    </div>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <p className="mb-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-zinc-800">
                        Consignes parents
                      </p>
                      <textarea
                        defaultValue={s.allergenNotes ?? ""}
                        key={`${s.id}-${s.allergenNotes ?? ""}`}
                        rows={2}
                        maxLength={500}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => void saveAllergenNotes(s, e.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-emerald-400"
                        placeholder="Allergène : à ne pas servir — précisez lequel (ex. traces d’œufs, pain sans gluten fourni par la famille)"
                      />
                    </div>
                    <p
                      className={[
                        "text-xs font-bold",
                        maternelle ? "text-sky-700" : "text-emerald-700",
                      ].join(" ")}
                    >
                      Voir le détail →
                    </p>
                  </div>
                </div>
                );
              })}
            </div>
          </section>
          );
        })}
        </div>
      )}
      </DashboardFoldOverlay>

      <Dialog
        open={openStudent != null}
        onOpenChange={(next) => {
          if (!next) {
            setOpenStudentId(null);
            setAddAllergenOpen(false);
            setAddRegimeOpen(false);
          }
        }}
      >
        <DialogContent
          className={[
            "z-[100] max-w-2xl overflow-hidden rounded-[28px] border-2 p-6 shadow-xl sm:max-w-2xl sm:p-8",
            openLevel === "MATERNELLE"
              ? "border-sky-200 bg-[#f4f9ff]"
              : "border-emerald-200 bg-[#f3fbf6]",
          ].join(" ")}
          overlayClassName="z-[100]"
        >
          {openStudent ? (
            <>
              <DialogHeader className="relative z-10 pr-8 text-left">
                <div className="flex items-start gap-4">
                  <div className="min-w-0">
                    <DialogTitle className="text-2xl font-extrabold tracking-tight text-zinc-950">
                      {openStudent.firstName} {openStudent.lastName}
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-extrabold ${
                            openLevel === "MATERNELLE"
                              ? "bg-sky-400 text-sky-950"
                              : "bg-emerald-400 text-emerald-950"
                          }`}
                        >
                          {schoolLevelLabelFr(openLevel)}
                        </span>
                        {openStudent.className ? (
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-extrabold ${
                              openLevel === "MATERNELLE"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {openStudent.className}
                          </span>
                        ) : null}
                        {openStudent.schoolName ? (
                          <span className="text-sm font-semibold text-zinc-500">
                            {openStudent.schoolName}
                          </span>
                        ) : null}
                      </div>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="relative z-10 space-y-5">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-800">
                      Allergènes
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {openStudent.allergens.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-sm font-bold text-white"
                        >
                          {a}
                          <button
                            type="button"
                            aria-label={`Retirer ${a}`}
                            onClick={() =>
                              void setAllergens(
                                openStudent,
                                openStudent.allergens.filter((x) => x !== a),
                              )
                            }
                            className="rounded-full p-0.5 hover:bg-white/20"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </span>
                      ))}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setAddAllergenOpen((v) => !v);
                            setAddRegimeOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-600 shadow-sm hover:border-emerald-400 hover:text-emerald-800"
                        >
                          <Plus className="size-3.5" aria-hidden />
                          Ajouter un allergène
                        </button>
                        {addAllergenOpen ? (
                          <div className="absolute left-0 z-20 mt-1 max-h-52 w-64 overflow-y-auto rounded-2xl border border-emerald-200 bg-white p-1.5 shadow-lg">
                            {EU14_ALLERGENS.filter(
                              (a) => !openStudent.allergens.includes(a),
                            ).map((a) => (
                              <button
                                key={a}
                                type="button"
                                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-emerald-50"
                                onClick={() => {
                                  void setAllergens(openStudent, [
                                    ...openStudent.allergens,
                                    a,
                                  ]);
                                  setAddAllergenOpen(false);
                                }}
                              >
                                {a}
                              </button>
                            ))}
                            {EU14_ALLERGENS.every((a) =>
                              openStudent.allergens.includes(a),
                            ) ? (
                              <p className="px-3 py-2 text-sm font-medium text-zinc-500">
                                Tous les allergènes sont déjà listés.
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                </div>

                <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-800">
                      Régimes
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {openStudent.noPork ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-3 py-1.5 text-sm font-bold text-zinc-800">
                          Sans porc
                          <button
                            type="button"
                            aria-label="Retirer sans porc"
                            onClick={() => void toggleDiet(openStudent, "noPork")}
                            className="rounded-full p-0.5 hover:bg-zinc-300"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </span>
                      ) : null}
                      {openStudent.vegetarian ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white">
                          Végétarien
                          <button
                            type="button"
                            aria-label="Retirer végétarien"
                            onClick={() => void toggleDiet(openStudent, "vegetarian")}
                            className="rounded-full p-0.5 hover:bg-white/20"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        </span>
                      ) : null}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setAddRegimeOpen((v) => !v);
                            setAddAllergenOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-600 shadow-sm hover:border-emerald-400 hover:text-emerald-800"
                        >
                          <Plus className="size-3.5" aria-hidden />
                          Ajouter un régime
                        </button>
                        {addRegimeOpen ? (
                          <div className="absolute left-0 z-20 mt-1 w-52 rounded-2xl border border-emerald-200 bg-white p-1.5 shadow-lg">
                            {!openStudent.noPork ? (
                              <button
                                type="button"
                                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-emerald-50"
                                onClick={() => {
                                  void toggleDiet(openStudent, "noPork");
                                  setAddRegimeOpen(false);
                                }}
                              >
                                Sans porc
                              </button>
                            ) : null}
                            {!openStudent.vegetarian ? (
                              <button
                                type="button"
                                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-emerald-50"
                                onClick={() => {
                                  void toggleDiet(openStudent, "vegetarian");
                                  setAddRegimeOpen(false);
                                }}
                              >
                                Végétarien
                              </button>
                            ) : null}
                            {openStudent.noPork && openStudent.vegetarian ? (
                              <p className="px-3 py-2 text-sm font-medium text-zinc-500">
                                Tous les régimes sont déjà listés.
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                </div>

                <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-800">
                      Consignes parents
                    </p>
                    <textarea
                      defaultValue={openStudent.allergenNotes ?? ""}
                      key={`${openStudent.id}-dialog-${openStudent.allergenNotes ?? ""}`}
                      rows={3}
                      maxLength={500}
                      onBlur={(e) =>
                        void saveAllergenNotes(openStudent, e.target.value)
                      }
                      className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-emerald-400"
                      placeholder="Allergène : à ne pas servir — précisez lequel (ex. traces d’œufs, pain sans gluten fourni par la famille)"
                    />
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="z-[100]" overlayClassName="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet élève ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.firstName} {toDelete?.lastName}
              {toDelete?.className ? ` (${toDelete.className})` : ""} sera retiré de
              la liste.
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
