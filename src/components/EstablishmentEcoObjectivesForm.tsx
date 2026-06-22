"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EcoObjectivePeriod } from "@/generated/prisma/client";
import { Label } from "@/components/ui/label";

const PERIOD_OPTIONS: { value: EcoObjectivePeriod; label: string }[] = [
  { value: "CALENDAR_YEAR", label: "Année civile (1er janv. → aujourd’hui)" },
  { value: "ISO_WEEK", label: "Semaine (lundi → aujourd’hui vs semaine d’avant)" },
  { value: "CALENDAR_QUARTER", label: "Trimestre civil (en cours vs trimestre précédent)" },
  { value: "SCHOOL_YEAR", label: "Année scolaire (depuis la rentrée)" },
];

type EstablishmentEcoObjectivesFormProps = {
  initialRestes: number | null;
  initialReduction: number | null;
  initialPeriod: EcoObjectivePeriod;
  initialSchoolMonth: number;
  initialSchoolDay: number;
};

export function EstablishmentEcoObjectivesForm(props: EstablishmentEcoObjectivesFormProps) {
  const resetKey = [
    props.initialRestes,
    props.initialReduction,
    props.initialPeriod,
    props.initialSchoolMonth,
    props.initialSchoolDay,
  ].join("|");

  return <EstablishmentEcoObjectivesFormFields key={resetKey} {...props} />;
}

function EstablishmentEcoObjectivesFormFields({
  initialRestes,
  initialReduction,
  initialPeriod,
  initialSchoolMonth,
  initialSchoolDay,
}: EstablishmentEcoObjectivesFormProps) {
  const router = useRouter();
  const [restes, setRestes] = useState(
    initialRestes != null ? String(initialRestes) : "",
  );
  const [reduction, setReduction] = useState(
    initialReduction != null ? String(initialReduction) : "",
  );
  const [period, setPeriod] = useState<EcoObjectivePeriod>(initialPeriod);
  const [schoolMonth, setSchoolMonth] = useState(String(initialSchoolMonth));
  const [schoolDay, setSchoolDay] = useState(String(initialSchoolDay));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = restes.trim() === "" ? null : Number(restes.replace(",", "."));
    const red = reduction.trim() === "" ? null : Number(reduction.replace(",", "."));
    const sm = Number(schoolMonth);
    const sd = Number(schoolDay);
    if (r != null && (Number.isNaN(r) || r < 0 || r > 100)) {
      setMsg("Objectif « restes pour 100 assiettes » : entre 0 et 100.");
      setBusy(false);
      return;
    }
    if (red != null && (Number.isNaN(red) || red < 0 || red > 100)) {
      setMsg("Objectif de baisse : entre 0 et 100 %.");
      setBusy(false);
      return;
    }
    if (
      period === "SCHOOL_YEAR" &&
      (Number.isNaN(sm) ||
        sm < 1 ||
        sm > 12 ||
        Number.isNaN(sd) ||
        sd < 1 ||
        sd > 31)
    ) {
      setMsg("Rentrez un mois (1–12) et un jour (1–31) valides pour la rentrée.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/establishment/eco", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ecoRestesServisTargetPct: r,
          ecoReductionTargetPct: red,
          ecoPeriodKind: period,
          ecoSchoolYearStartMonth: period === "SCHOOL_YEAR" ? sm : undefined,
          ecoSchoolYearStartDay: period === "SCHOOL_YEAR" ? sd : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        warning?: string;
      };
      if (!res.ok) {
        setMsg(
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : "Enregistrement impossible.",
        );
        return;
      }
      if (typeof data.warning === "string" && data.warning.length > 0) {
        setMsg(`Enregistré (partiel). ${data.warning}`);
      } else {
        setMsg("Objectifs enregistrés. Le dashboard utilise ces valeurs.");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-zinc-900 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Défauts objectifs (établissement)</h2>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
        La <strong className="text-zinc-900">période</strong> et les pourcentages ci-dessous servent de{" "}
        <strong className="text-zinc-900">référence par défaut</strong> pour toutes les classes. Au-dessus de ce bloc,
        chaque carte de groupe a le bouton <strong className="text-zinc-900">Objectifs</strong> pour des plafonds
        propres à la classe. Remplissez les champs puis cliquez sur{" "}
        <strong className="text-zinc-900">Enregistrer les objectifs</strong> : le tableau de bord compare chaque classe
        à sa cible effective (classe ou défaut).
      </p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="eco-period" className="text-zinc-900">
            Période pour les objectifs
          </Label>
          <select
            id="eco-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as EcoObjectivePeriod)}
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-emerald-600"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {period === "SCHOOL_YEAR" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="eco-sy-m" className="text-zinc-900">
                Mois de rentrée (1–12)
              </Label>
              <input
                id="eco-sy-m"
                type="number"
                min={1}
                max={12}
                value={schoolMonth}
                onChange={(e) => setSchoolMonth(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <Label htmlFor="eco-sy-d" className="text-zinc-900">
                Jour (1–31)
              </Label>
              <input
                id="eco-sy-d"
                type="number"
                min={1}
                max={31}
                value={schoolDay}
                onChange={(e) => setSchoolDay(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="eco-r" className="text-zinc-900">
              Plafond restes / 100 assiettes (%)
            </Label>
            <input
              id="eco-r"
              type="text"
              inputMode="decimal"
              placeholder="ex. 8"
              value={restes}
              onChange={(e) => setRestes(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <Label htmlFor="eco-red" className="text-zinc-900">
              Baisse des restes visée vs période d’avant (%)
            </Label>
            <input
              id="eco-red"
              type="text"
              inputMode="decimal"
              placeholder="ex. 10"
              value={reduction}
              onChange={(e) => setReduction(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {msg ? (
          <p
            className={
              msg.startsWith("Objectifs") || msg.startsWith("Enregistré")
                ? "text-sm font-medium text-emerald-800"
                : "text-sm text-rose-700"
            }
          >
            {msg}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border border-emerald-700 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
        >
          {busy ? "Enregistrement…" : "Enregistrer les objectifs"}
        </button>
      </form>
    </section>
  );
}
