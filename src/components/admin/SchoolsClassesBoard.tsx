"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Target, Trash2 } from "lucide-react";
import { GroupEcoObjectivesDialog } from "@/app/(authed)/admin/groups/GroupEcoObjectivesDialog";
import { DashboardFoldOverlay } from "@/components/dashboard/DashboardFoldOverlay";
import { GroupNameBadge } from "@/components/GroupNameBadge";
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

type SchoolRow = {
  id: string;
  name: string;
  active: boolean;
  groupCount: number;
};

type GroupRow = {
  id: string;
  name: string;
  active: boolean;
  schoolId: string;
  schoolName: string;
  level: SchoolLevel;
  ecoRestesServisTargetPct: number | null;
  ecoReductionTargetPct: number | null;
};

function mapGroup(x: Record<string, unknown>): GroupRow {
  return {
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
  };
}

export function SchoolsClassesFold({
  establishmentEco,
  labelledBy = "dashboard-schools-classes-overlay",
}: {
  establishmentEco: EstablishmentEcoSettings;
  labelledBy?: string;
}) {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<GroupRow | null>(null);
  const [ecoGroup, setEcoGroup] = useState<GroupRow | null>(null);
  const [ecoOpen, setEcoOpen] = useState(false);

  const activeCount = useMemo(
    () => groups.filter((g) => g.active).length,
    [groups],
  );

  const groupsBySchool = useMemo(() => {
    const map = new Map<string, { schoolName: string; groups: GroupRow[] }>();
    for (const g of groups) {
      const bucket = map.get(g.schoolId) ?? { schoolName: g.schoolName, groups: [] };
      bucket.groups.push(g);
      map.set(g.schoolId, bucket);
    }
    for (const bucket of map.values()) {
      bucket.groups.sort((a, b) => {
        if (a.level !== b.level) return a.level === "PRIMAIRE" ? -1 : 1;
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
      setGroups(data.groups.map(mapGroup));
    }
    if (schoolsRes.ok) {
      const data = (await schoolsRes.json()) as { schools: SchoolRow[] };
      setSchools(data.schools);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function toggleActive(g: GroupRow) {
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
    try {
      const res = await fetch(`/api/groups/${toDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setToDelete(null);
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DashboardFoldOverlay
        kicker="Classes"
        openLabel="Ouvrir Écoles et classes"
        overlayTitle="Écoles et classes"
        subtitle="Pour des cibles différentes par classe, utilisez le bouton Objectifs sur chaque carte. Laissez les champs vides pour reprendre les défauts établissement."
        hint={`${schools.length} école${schools.length > 1 ? "s" : ""} · ${activeCount} classe${activeCount > 1 ? "s" : ""} active${activeCount > 1 ? "s" : ""}. Vert = primaire, bleu = maternelle.`}
        icon={GraduationCap}
        labelledBy={labelledBy}
        foldShape="ball"
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
                          "relative rounded-2xl border p-4 shadow-sm transition duration-200 hover:z-20 hover:scale-[1.03] hover:shadow-lg motion-reduce:transform-none",
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
                            g.level === "MATERNELLE"
                              ? "border-sky-200/80"
                              : "border-emerald-200/80",
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
        <AlertDialogContent className="z-[100]" overlayClassName="z-[100]">
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
    </>
  );
}
