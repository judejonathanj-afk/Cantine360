"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { EstablishmentEcoSettings } from "@/server/establishmentEco";

type GroupEco = {
  id: string;
  name: string;
  ecoRestesServisTargetPct: number | null;
  ecoReductionTargetPct: number | null;
};

function GroupEcoObjectivesFields({
  group,
  establishmentEco,
  onOpenChange,
  onSaved,
}: {
  group: GroupEco;
  establishmentEco: EstablishmentEcoSettings;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [restes, setRestes] = useState(() =>
    group.ecoRestesServisTargetPct != null
      ? String(group.ecoRestesServisTargetPct)
      : "",
  );
  const [reduction, setReduction] = useState(() =>
    group.ecoReductionTargetPct != null ? String(group.ecoReductionTargetPct) : "",
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const defR = establishmentEco.ecoRestesServisTargetPct;
  const defRed = establishmentEco.ecoReductionTargetPct;

  async function save() {
    setBusy(true);
    setMsg(null);
    const r = restes.trim() === "" ? null : Number(restes.replace(",", "."));
    const red = reduction.trim() === "" ? null : Number(reduction.replace(",", "."));
    if (r != null && (Number.isNaN(r) || r < 0 || r > 100)) {
      setMsg("Plafond : entre 0 et 100.");
      setBusy(false);
      return;
    }
    if (red != null && (Number.isNaN(red) || red < 0 || red > 100)) {
      setMsg("Baisse visée : entre 0 et 100 %.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ecoRestesServisTargetPct: r,
          ecoReductionTargetPct: red,
        }),
      });
      if (!res.ok) {
        setMsg("Enregistrement impossible.");
        return;
      }
      onOpenChange(false);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" aria-hidden />
          Objectifs — {group.name}
        </DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-2 text-left text-sm text-muted-foreground">
            <p>
              Valeurs <strong className="text-foreground">propres à cette classe</strong>.
              Laissez un champ vide pour reprendre le{" "}
              <strong className="text-foreground">défaut établissement</strong> (bloc{" "}
              <strong className="text-foreground">Défauts objectifs</strong> en bas de cette page).
            </p>
            <p>
              Défauts actuels établissement : plafond{" "}
              {defR != null ? (
                <strong className="text-foreground">{defR}</strong>
              ) : (
                <span className="text-foreground">—</span>
              )}{" "}
              % / 100 assiettes ; baisse{" "}
              {defRed != null ? (
                <strong className="text-foreground">{defRed}</strong>
              ) : (
                <span className="text-foreground">—</span>
              )}{" "}
              %.
            </p>
          </div>
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <EcoInputField
          id="g-eco-r"
          label="Plafond restes / 100 assiettes (%)"
          placeholder={defR != null ? `Défaut établissement : ${defR}` : "ex. 8"}
          value={restes}
          onChange={setRestes}
        />
        <EcoInputField
          id="g-eco-red"
          label="Baisse des restes visée vs période d’avant (%)"
          placeholder={defRed != null ? `Défaut établissement : ${defRed}` : "ex. 10"}
          value={reduction}
          onChange={setReduction}
        />
        {msg ? <p className="text-sm text-rose-700">{msg}</p> : null}
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button type="button" disabled={busy} onClick={() => void save()}>
          {busy ? "…" : "Enregistrer"}
        </Button>
      </DialogFooter>
    </>
  );
}

function EcoInputField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
      />
    </div>
  );
}

export function GroupEcoObjectivesDialog({
  group,
  establishmentEco,
  open,
  onOpenChange,
  onSaved,
}: {
  group: GroupEco | null;
  establishmentEco: EstablishmentEcoSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <GroupEcoObjectivesFields
          key={group.id}
          group={group}
          establishmentEco={establishmentEco}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
