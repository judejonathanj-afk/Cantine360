"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { CsvImportZone } from "@/components/admin/CsvImportZone";
import { DashboardFoldOverlay } from "@/components/dashboard/DashboardFoldOverlay";
import { FloatingCloseButton } from "@/components/dashboard/FloatingCloseButton";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { EU14_ALLERGENS, type AllergenLabel } from "@/lib/allergens";
import {
  DIET_KEYS,
  DIET_META,
  emptyStudentDiets,
  pickStudentDiets,
  type DietKey,
  type StudentDiets,
} from "@/lib/dietaryRegime";
import { formatGroupLabel } from "@/lib/groupLabel";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
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
  level?: SchoolLevel;
};

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  allergens: string[];
  allergenNotes: string | null;
  active: boolean;
  groupId: string;
  className: string;
  schoolName: string;
} & StudentDiets;

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
  const [students, setStudents] = useState<Student[]>(() =>
    initialStudents.map((s) => ({ ...s, ...pickStudentDiets(s) })),
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [groupId, setGroupId] = useState(groups.find((g) => g.active)?.id ?? "");
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenLabel[]>([]);
  const [allergenNotes, setAllergenNotes] = useState("");
  const [draftDiets, setDraftDiets] = useState<StudentDiets>(emptyStudentDiets());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [cardMenu, setCardMenu] = useState<{ id: string } | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const activeGroups = useMemo(() => groups.filter((g) => g.active), [groups]);
  const groupLevelById = useMemo(() => {
    const map = new Map<string, SchoolLevel>();
    for (const g of groups) {
      map.set(g.id, g.level ?? "PRIMAIRE");
    }
    return map;
  }, [groups]);
  const withAllergens = students.filter((s) => s.active && s.allergens.length > 0).length;
  const dietCounts = Object.fromEntries(
    DIET_KEYS.map((key) => [
      key,
      students.filter((s) => s.active && s[key]).length,
    ]),
  ) as Record<DietKey, number>;

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
    setStudents(
      data.students.map((s) => ({
        ...s,
        ...pickStudentDiets(s),
      })),
    );
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
          ...draftDiets,
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
      setDraftDiets(emptyStudentDiets());
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function patchStudent(s: Student, body: Record<string, unknown>) {
    const res = await fetch(`/api/students/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) await refresh();
    return res.ok;
  }

  async function saveAllergenNotes(s: Student, notes: string) {
    const next = notes.trim() || null;
    if ((s.allergenNotes ?? null) === next) return;
    setStudents((all) =>
      all.map((x) => (x.id === s.id ? { ...x, allergenNotes: next } : x)),
    );
    await patchStudent(s, { allergenNotes: next });
  }

  async function setAllergens(s: Student, allergens: string[]) {
    setStudents((all) =>
      all.map((x) => (x.id === s.id ? { ...x, allergens } : x)),
    );
    await patchStudent(s, { allergens });
  }

  async function toggleDiet(s: Student, field: DietKey) {
    const next = !s[field];
    setStudents((all) =>
      all.map((x) => (x.id === s.id ? { ...x, [field]: next } : x)),
    );
    await patchStudent(s, { [field]: next });
  }

  async function toggleActive(s: Student) {
    const next = !s.active;
    setStudents((all) =>
      all.map((x) => (x.id === s.id ? { ...x, active: next } : x)),
    );
    await patchStudent(s, { active: next });
  }

  async function changeGroup(s: Student, nextGroupId: string) {
    if (nextGroupId === s.groupId) return;
    const g = groups.find((x) => x.id === nextGroupId);
    if (!g) return;
    setStudents((all) =>
      all.map((x) =>
        x.id === s.id
          ? {
              ...x,
              groupId: g.id,
              className: g.name,
              schoolName: g.schoolName,
            }
          : x,
      ),
    );
    await patchStudent(s, { groupId: nextGroupId });
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
      {!listOpen ? (
      <>
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
          {withAllergens > 1 ? "s" : ""} déclaré{withAllergens > 1 ? "s" : ""}
          {DIET_KEYS.filter((key) => dietCounts[key] > 0).map((key) => (
            <span key={key}>
              {" "}
              · <span className="font-bold">{dietCounts[key]}</span>{" "}
              {dietCounts[key] > 1 ? DIET_META[key].labelPlural : DIET_META[key].label.toLowerCase()}
            </span>
          ))}
        </p>
        <p className="w-full text-base leading-relaxed text-zinc-700 sm:text-lg">
          Cette page enregistre la liste des <strong className="font-semibold text-zinc-900">élèves</strong>
          , leurs <strong className="font-semibold text-zinc-900">allergènes</strong> et les
          régimes <strong className="font-semibold text-zinc-900">sans porc, végétarien, végétalien, pescétarien, sans bœuf, halal, casher</strong>{" "}
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
                "vegetalien",
                "pescetarien",
                "sans_boeuf",
                "halal",
                "casher",
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
            {DIET_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setDraftDiets((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                className={[
                  "rounded-full px-2.5 py-1 text-sm font-bold",
                  draftDiets[key] ? DIET_META[key].chipClass : "bg-zinc-100 text-zinc-800",
                ].join(" ")}
              >
                {DIET_META[key].label}
              </button>
            ))}
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

      <section className="overflow-hidden rounded-[28px] bg-[#0d3b2e] shadow-[0_12px_32px_rgba(13,59,46,0.28)] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100">
        <button
          type="button"
          onClick={() => setListOpen(true)}
          aria-expanded={false}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/5 sm:px-5 sm:py-4"
        >
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] sm:size-[3.75rem]"
            aria-hidden
          >
            <span className="flex size-11 items-center justify-center rounded-[14px] bg-[#d8f48a] text-[#0d3b2e] sm:size-12 sm:rounded-2xl">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              Liste
            </span>
            <span className="block text-base font-extrabold tracking-tight text-white sm:text-lg">
              Ouvrir Élèves et allergènes
            </span>
            <span className="mt-0.5 block text-sm leading-snug text-white/80">
              Parcourez les élèves par classe — dans cette page.
            </span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-white/70" aria-hidden />
        </button>
      </section>
      </>
      ) : (
      <>
        <div className="min-w-0 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
            Élèves
          </p>
          <h1
            id="admin-students-list-title"
            className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl"
          >
            <Users className="h-7 w-7 shrink-0 text-emerald-700" strokeWidth={2.25} aria-hidden />
            Élèves et allergènes
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-snug text-zinc-600 sm:text-base">
            Parcourez les élèves par classe : allergènes, régimes et consignes
            parents. Modifiez-les directement sur la carte.
          </p>
        </div>
        <FloatingCloseButton onClick={() => setListOpen(false)} />
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {byClass.length === 0 ? (
        <p className="px-3 py-10 text-center text-base font-bold leading-relaxed text-zinc-900 sm:text-lg">
          Aucun élève pour l’instant. Ouvrez l’import CSV ou ajoutez un élève à la
          main.
        </p>
      ) : (
        <div className="space-y-5 p-1 pb-24 sm:p-2 sm:pb-28">
        {byClass.map(([gid, bucket]) => {
          const allergyN = bucket.students.filter((s) => s.allergens.length > 0).length;
          return (
          <section key={gid} className="space-y-3">
            <div className="rounded-2xl bg-emerald-800 px-4 py-3">
              <h2 className="text-lg font-extrabold tracking-tight text-white sm:text-xl">
                {bucket.label}
              </h2>
              <p className="mt-1 text-sm font-bold leading-snug text-emerald-50">
                {allergyN} allergie{allergyN > 1 ? "s" : ""}
                {DIET_KEYS.map((key) => {
                  const n = bucket.students.filter((s) => s[key]).length;
                  if (n === 0) return null;
                  return ` · ${n} ${n > 1 ? DIET_META[key].labelPlural : DIET_META[key].label.toLowerCase()}`;
                }).join("")}{" "}
                · {bucket.students.length}{" "}
                élève{bucket.students.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid gap-3 overflow-visible sm:grid-cols-2">
              {bucket.students.map((s) => {
                const level = groupLevelById.get(s.groupId) ?? "PRIMAIRE";
                const maternelle = level === "MATERNELLE";
                const allergenMenuOpen = cardMenu?.id === s.id;
                return (
                <div
                  key={s.id}
                  className={[
                    "relative flex flex-col gap-4 overflow-visible rounded-[28px] border-2 px-5 py-5 text-left shadow-[0_10px_28px_-18px_rgba(15,23,42,0.45)] sm:px-6 sm:py-6",
                    maternelle
                      ? "border-[#62b3e0] bg-white"
                      : "border-[#6dcaa0] bg-white",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-extrabold tracking-tight text-zinc-950">
                        {s.firstName} {s.lastName}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-extrabold ${
                            maternelle
                              ? "bg-[#2e9cdc] text-white"
                              : "bg-[#0f9d58] text-white"
                          }`}
                        >
                          {schoolLevelLabelFr(level)}
                        </span>
                        <select
                          value={s.groupId}
                          aria-label="Classe"
                          onChange={(e) => void changeGroup(s, e.target.value)}
                          className={`max-w-[11rem] rounded-full px-3 py-1 text-sm font-extrabold outline-none ${
                            maternelle
                              ? "bg-[#b9dff5] text-[#0b4a66]"
                              : "bg-[#c4f0d8] text-[#14532d]"
                          }`}
                        >
                          {activeGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        {s.schoolName ? (
                          <span className="text-sm font-semibold text-zinc-600">
                            {s.schoolName}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleActive(s)}
                        className={[
                          "rounded-full px-3 py-1 text-sm font-extrabold",
                          s.active
                            ? "bg-[#0f9d58] text-white"
                            : "bg-white/80 text-zinc-700",
                        ].join(" ")}
                      >
                        {s.active ? "Actif" : "Inactif"}
                      </button>
                      <button
                        type="button"
                        className="rounded-full p-1.5 text-zinc-600 hover:bg-white/80 hover:text-zinc-950"
                        aria-label={`Supprimer ${s.firstName} ${s.lastName}`}
                        onClick={() => setToDelete(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-800">
                      Allergènes
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {s.allergens.map((a) => (
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
                                s,
                                s.allergens.filter((x) => x !== a),
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
                          onClick={() =>
                            setCardMenu(
                              allergenMenuOpen ? null : { id: s.id },
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm hover:border-emerald-400"
                        >
                          <Plus className="size-3.5" aria-hidden />
                          Ajouter un allergène
                        </button>
                        {allergenMenuOpen ? (
                          <div className="absolute left-0 z-20 mt-1 max-h-52 w-64 overflow-y-auto rounded-2xl border border-emerald-200 bg-white p-1.5 shadow-lg">
                            {EU14_ALLERGENS.filter(
                              (a) => !s.allergens.includes(a),
                            ).map((a) => (
                              <button
                                key={a}
                                type="button"
                                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-emerald-50"
                                onClick={() => {
                                  void setAllergens(s, [...s.allergens, a]);
                                  setCardMenu(null);
                                }}
                              >
                                {a}
                              </button>
                            ))}
                            {EU14_ALLERGENS.every((a) =>
                              s.allergens.includes(a),
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
                      {DIET_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => void toggleDiet(s, key)}
                          className={[
                            "rounded-full px-3 py-1.5 text-sm font-extrabold shadow-sm",
                            s[key] ? DIET_META[key].chipClass : "bg-white/90 text-zinc-500",
                          ].join(" ")}
                        >
                          {DIET_META[key].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-800">
                      Consignes parents
                    </p>
                    <textarea
                      defaultValue={s.allergenNotes ?? ""}
                      key={`${s.id}-${s.allergenNotes ?? ""}`}
                      rows={3}
                      maxLength={500}
                      onBlur={(e) => void saveAllergenNotes(s, e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-emerald-400"
                      placeholder="Allergène : à ne pas servir — précisez lequel (ex. traces d’œufs, pain sans gluten fourni par la famille)"
                    />
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
      </>
      )}


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
