"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import type { EcoObjectivePeriod } from "@/generated/prisma/client";
import { Label } from "@/components/ui/label";

const PERIOD_OPTIONS: { value: EcoObjectivePeriod; label: string }[] = [
  {
    value: "CALENDAR_YEAR",
    label: "Année civile — du 1er janvier à aujourd’hui (comparée à l’an dernier à la même date)",
  },
  {
    value: "ISO_WEEK",
    label: "Semaine — du lundi à aujourd’hui (comparée à la semaine précédente)",
  },
  {
    value: "CALENDAR_QUARTER",
    label: "Trimestre civil — trimestre en cours (comparé au trimestre précédent)",
  },
  {
    value: "SCHOOL_YEAR",
    label: "Année scolaire — depuis la date de rentrée (comparée à l’année scolaire d’avant)",
  },
];

type EstablishmentEcoObjectivesFormProps = {
  initialRestes: number | null;
  initialReduction: number | null;
  initialPeriod: EcoObjectivePeriod;
  initialSchoolMonth: number;
  initialSchoolDay: number;
  /** Sans cadre ni titre (déjà dans un volet). */
  embedded?: boolean;
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
  embedded = false,
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
        setMsg(
          "Objectifs enregistrés. Cantine+ compare chaque classe à ces cibles, sauf si une classe a ses propres objectifs.",
        );
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const intro = (
    <div
      className={
        embedded ? "space-y-3" : "space-y-3 px-5 pt-4"
      }
    >
      <p className="text-lg font-bold leading-snug text-zinc-950 sm:text-xl">
        Ces chiffres sont la{" "}
        <span className="underline decoration-emerald-500 decoration-2 underline-offset-4">
          référence de l’établissement
        </span>{" "}
        pour Cantine+ : le tableau de bord les applique à toutes les classes, sauf
        si une classe a son propre bouton{" "}
        <span className="underline decoration-emerald-500 decoration-2 underline-offset-4">
          Objectifs
        </span>
        .
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50 px-4 py-4">
          <p className="inline-flex rounded-full bg-emerald-700 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
            À quoi ça sert
          </p>
          <p className="mt-3 text-base font-bold leading-relaxed text-zinc-950">
            Suivre les restes d’assiettes saisis au service (compteur), en
            pourcentage. Ex. 8 % = 8 restes pour 100 assiettes servies, sur la
            période choisie.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-amber-600 bg-amber-50 px-4 py-4">
          <p className="inline-flex rounded-full bg-amber-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
            Ce que ce n’est pas
          </p>
          <p className="mt-3 text-base font-bold leading-relaxed text-zinc-950">
            Ce n’est pas l’objectif anti-gaspillage en grammes / 100. Les pesées
            cuisine se règlent sur la page Antigaspillage. Les deux peuvent être
            actifs ensemble, sans se mélanger.
          </p>
        </div>
      </div>
    </div>
  );

  const form = (
      <form onSubmit={submit} className={embedded ? "mt-4 space-y-4" : "space-y-4 px-5 py-4"}>
        <div>
          <Label htmlFor="eco-period" className="text-base font-extrabold text-zinc-950">
            Période de comparaison
          </Label>
          <p className="mt-1 text-base font-semibold leading-snug text-zinc-900">
            Fenêtre utilisée par Cantine+ pour calculer les restes et les comparer
            à la période d’avant. Indépendante des filtres 7 / 30 jours.
          </p>
          <select
            id="eco-period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as EcoObjectivePeriod)}
            className="mt-2 w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2.5 text-base font-semibold text-zinc-950 outline-none focus:border-emerald-600"
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
              <Label htmlFor="eco-sy-m" className="text-base font-extrabold text-zinc-950">
                Mois de rentrée (1 = janvier … 12 = décembre)
              </Label>
              <input
                id="eco-sy-m"
                type="number"
                min={1}
                max={12}
                value={schoolMonth}
                onChange={(e) => setSchoolMonth(e.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-zinc-900 px-3 py-2.5 text-base font-semibold text-zinc-950 outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <Label htmlFor="eco-sy-d" className="text-base font-extrabold text-zinc-950">
                Jour de rentrée (1–31)
              </Label>
              <input
                id="eco-sy-d"
                type="number"
                min={1}
                max={31}
                value={schoolDay}
                onChange={(e) => setSchoolDay(e.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-zinc-900 px-3 py-2.5 text-base font-semibold text-zinc-950 outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="eco-r" className="text-base font-extrabold text-zinc-950">
              Plafond de restes (%)
            </Label>
            <p className="mt-1 text-base font-semibold leading-snug text-zinc-900">
              Maximum accepté : restes d’assiettes pour 100 repas servis. Ex. 8 =
              pas plus de 8 restes sur 100 assiettes. Laissez vide pour ne pas
              fixer de plafond.
            </p>
            <input
              id="eco-r"
              type="text"
              inputMode="decimal"
              placeholder="ex. 8"
              value={restes}
              onChange={(e) => setRestes(e.target.value)}
              className="mt-2 w-full rounded-xl border-2 border-zinc-900 px-3 py-2.5 text-base font-semibold text-zinc-950 outline-none placeholder:font-medium placeholder:text-zinc-500 focus:border-emerald-600"
            />
          </div>
          <div>
            <Label htmlFor="eco-red" className="text-base font-extrabold text-zinc-950">
              Baisse visée par rapport à la période d’avant (%)
            </Label>
            <p className="mt-1 text-base font-semibold leading-snug text-zinc-900">
              Ambition de progrès. Ex. 10 = 10 % de restes en moins qu’à la
              période précédente. Laissez vide si vous ne suivez que le plafond.
            </p>
            <input
              id="eco-red"
              type="text"
              inputMode="decimal"
              placeholder="ex. 10"
              value={reduction}
              onChange={(e) => setReduction(e.target.value)}
              className="mt-2 w-full rounded-xl border-2 border-zinc-900 px-3 py-2.5 text-base font-semibold text-zinc-950 outline-none placeholder:font-medium placeholder:text-zinc-500 focus:border-emerald-600"
            />
          </div>
        </div>

        {msg ? (
          <p
            className={
              msg.startsWith("Objectifs") || msg.startsWith("Enregistré")
                ? "text-base font-bold text-emerald-800"
                : "text-base font-bold text-rose-700"
            }
          >
            {msg}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border border-emerald-700 bg-emerald-600 px-4 py-3 text-base font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
        >
          {busy ? "Enregistrement…" : "Enregistrer les objectifs"}
        </button>
      </form>
  );

  if (embedded) {
    return (
      <div className="p-1 sm:p-2">
        {intro}
        {form}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-zinc-900 bg-white shadow-sm">
      <h2 className="flex items-center gap-2.5 border-b-2 border-zinc-900 bg-amber-50 px-5 py-3 text-lg font-bold text-zinc-950">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600">
          <Target className="size-4" aria-hidden />
        </span>
        Défauts objectifs (établissement)
      </h2>
      {intro}
      {form}
    </section>
  );
}
