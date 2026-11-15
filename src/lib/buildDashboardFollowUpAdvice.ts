import { antiWasteStatus, type AntiWasteStatusTone } from "@/lib/antiWasteStatus";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";

export type FollowUpAdviceItem = {
  key: string;
  label: string;
  hint: string;
};

export type FollowUpAdviceFact = {
  key: string;
  pill: string;
  title: string;
  text: string;
};

export type DashboardFollowUpAdvice = {
  tone: AntiWasteStatusTone;
  lead: string;
  badge: string;
  detail: string;
  hint: string;
  items: FollowUpAdviceItem[];
  facts: FollowUpAdviceFact[];
};

function formatDayLong(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

function formatDayShort(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function fmt1(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function latestActiveRow(rows: DashboardDayDetailRow[]) {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = sorted.length - 1; i >= 0; i--) {
    const row = sorted[i]!;
    if (row.served > 0 || row.wasteWeightG > 0 || row.rab > 0 || row.refused > 0) {
      return { row, previous: sorted[i - 1] ?? null };
    }
  }
  return { row: null, previous: null };
}

function g100(row: DashboardDayDetailRow | null) {
  if (!row) return null;
  if (row.wasteGramsPer100 != null && row.wasteGramsPer100 > 0) {
    return row.wasteGramsPer100;
  }
  if (row.served > 0 && row.wasteWeightG > 0) {
    return (row.wasteWeightG / row.served) * 100;
  }
  return null;
}

function isMissingWeigh(row: DashboardDayDetailRow) {
  return /manqu/i.test(row.weighLabel);
}

function pickPeak(
  rows: DashboardDayDetailRow[],
  score: (row: DashboardDayDetailRow) => number,
) {
  let best: DashboardDayDetailRow | null = null;
  let bestScore = -Infinity;
  for (const row of rows) {
    const s = score(row);
    if (s > bestScore) {
      best = row;
      bestScore = s;
    }
  }
  return bestScore > 0 ? best : null;
}

function pickMin(
  rows: DashboardDayDetailRow[],
  score: (row: DashboardDayDetailRow) => number,
) {
  let best: DashboardDayDetailRow | null = null;
  let bestScore = Infinity;
  for (const row of rows) {
    const s = score(row);
    if (s > 0 && s < bestScore) {
      best = row;
      bestScore = s;
    }
  }
  return best;
}

export function buildDashboardFollowUpAdvice({
  days,
  rows,
  wasteGramsPer100,
  targetGPer100,
}: {
  days: 7 | 30;
  rows: DashboardDayDetailRow[];
  wasteGramsPer100: number | null;
  targetGPer100: number | null;
}): DashboardFollowUpAdvice {
  const status = antiWasteStatus(wasteGramsPer100, targetGPer100);
  const { row: last, previous } = latestActiveRow(rows);
  const lastG = g100(last);
  const prevG = g100(previous);

  const weighed = rows.filter((r) => r.wasteWeightG > 0);
  const missingWeighCount = rows.filter(isMissingWeigh).length;
  const served = rows.reduce((s, r) => s + r.served, 0);
  const rab = rows.reduce((s, r) => s + r.rab, 0);
  const refused = rows.reduce((s, r) => s + r.refused, 0);
  const wasteMat = rows.reduce((s, r) => s + r.wasteWeightMaternelleG, 0);
  const wastePri = rows.reduce((s, r) => s + r.wasteWeightPrimaireG, 0);
  const wasteTotal = wasteMat + wastePri;
  const rabRatePct = served > 0 ? (rab / served) * 100 : null;
  const refusalRatePct = served > 0 ? (refused / served) * 100 : null;

  const heaviest = pickPeak(weighed, (r) => g100(r) ?? r.wasteWeightG);
  const lightest = pickMin(weighed, (r) => g100(r) ?? r.wasteWeightG);

  let streakAboveTarget = 0;
  if (targetGPer100 != null && targetGPer100 > 0) {
    const chronological = [...weighed].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = chronological.length - 1; i >= 0; i--) {
      const value = g100(chronological[i]!);
      if (value != null && value > targetGPer100) streakAboveTarget += 1;
      else break;
    }
  }

  const emptyItems: FollowUpAdviceItem[] = [
    {
      key: "waste",
      label: "Pas encore de déchets",
      hint: "Peser maternelle et primaire en fin de service.",
    },
    {
      key: "service",
      label: "Service non saisi",
      hint: "Renseigner présents, servis, RAB et refus.",
    },
    {
      key: "trend",
      label: "Tendance indisponible",
      hint: "Il faudra au moins deux jours pesés.",
    },
  ];

  if (!last) {
    return {
      tone: "none",
      badge: "En attente",
      lead: `Aucun service pesé sur ${days} jours — l’avis s’affichera dès la première saisie.`,
      detail: status.detail,
      hint: status.hint,
      items: emptyItems,
      facts: [
        {
          key: "pesee",
          pill: "Pesées",
          title: "0 service pesé",
          text: "Ouvrez un service, saisissez les assiettes puis enregistrez les déchets maternelle et primaire.",
        },
      ],
    };
  }

  const lastKg = (last.wasteWeightG / 1000).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
  const wasteLabel =
    lastG != null
      ? `${fmt(lastG)} g / 100`
      : last.wasteWeightG > 0
        ? `${lastKg} kg jetés`
        : "Pesée encore vide";
  const wasteHint =
    lastG != null
      ? `Dernier service (${formatDayLong(last.date)}) : ${lastKg} kg de déchets.`
      : `Ouvrir le service du ${formatDayLong(last.date)} et enregistrer la pesée.`;

  const serviceLabel =
    last.served > 0
      ? `${fmt(last.served)} assiette${last.served > 1 ? "s" : ""}`
      : "Assiettes non saisies";
  const serviceHint =
    last.served > 0
      ? `RAB ${fmt(last.rab)} · refus ${fmt(last.refused)} sur le dernier service.`
      : "Saisir les compteurs pour affiner l’avis.";

  let trendLabel = "Tendance à confirmer";
  let trendHint = "Comparez avec le prochain service pesé.";
  if (lastG != null && prevG != null) {
    const delta = lastG - prevG;
    if (Math.abs(delta) < 3) {
      trendLabel = "Tendance stable";
      trendHint = "Les g / 100 du dernier service sont proches du précédent.";
    } else if (delta < 0) {
      trendLabel = "Tendance en baisse";
      trendHint = `${fmt(Math.abs(delta))} g / 100 de moins que le service d’avant.`;
    } else {
      trendLabel = "Tendance en hausse";
      trendHint = `${fmt(delta)} g / 100 de plus que le service d’avant.`;
    }
  } else if (targetGPer100 != null && targetGPer100 > 0 && wasteGramsPer100 != null) {
    trendLabel =
      wasteGramsPer100 <= targetGPer100 ? "Sous l’objectif" : "Au-dessus de l’objectif";
    trendHint = status.hint;
  }

  const badge =
    status.tone === "ok"
      ? "Dans le vert"
      : status.tone === "alert"
        ? "À corriger"
        : status.tone === "watch"
          ? "À surveiller"
          : "En direct";

  const facts: FollowUpAdviceFact[] = [];

  facts.push({
    key: "lecture",
    pill: "Lecture",
    title: status.title,
    text: status.detail,
  });

  if (targetGPer100 != null && targetGPer100 > 0) {
    const vs =
      wasteGramsPer100 != null
        ? wasteGramsPer100 - targetGPer100
        : null;
    facts.push({
      key: "objectif",
      pill: "Objectif",
      title: `${fmt(targetGPer100)} g / 100`,
      text:
        vs == null
          ? "Objectif fixé : comparez-le dès qu’une pesée est saisie."
          : vs <= 0
            ? `${fmt(Math.abs(vs))} g / 100 sous l’objectif sur la période.`
            : `${fmt(vs)} g / 100 au-dessus de l’objectif sur la période.`,
    });
  } else {
    facts.push({
      key: "objectif",
      pill: "Objectif",
      title: "Pas encore fixé",
      text: status.hint,
    });
  }

  facts.push({
    key: "dernier",
    pill: "Dernier service",
    title: formatDayLong(last.date),
    text: [
      last.menuSummary && last.menuSummary !== "—" ? `Menu : ${last.menuSummary}.` : null,
      `${fmt(last.present)} présents · ${fmt(last.served)} servis · RAB ${fmt(last.rab)} · refus ${fmt(last.refused)}.`,
      last.wasteWeightG > 0
        ? `Déchets ${lastKg} kg${lastG != null ? ` · ${fmt1(lastG)} g / 100` : ""}.`
        : "Pesée encore manquante ce jour-là.",
    ]
      .filter(Boolean)
      .join(" "),
  });

  facts.push({
    key: "pesees",
    pill: "Pesées",
    title: `${weighed.length} / ${rows.length} service${rows.length > 1 ? "s" : ""}`,
    text:
      missingWeighCount > 0
        ? `${missingWeighCount} service${missingWeighCount > 1 ? "s" : ""} encore sans pesée — le suivi g / 100 est incomplet.`
        : weighed.length > 0
          ? "Les pesées de la période sont saisies."
          : "Aucune pesée sur la période.",
  });

  if (rabRatePct != null) {
    facts.push({
      key: "rab",
      pill: "Taux de RAB",
      title: `${fmt1(rabRatePct)} %`,
      text: `Part du rab sur les assiettes servies (${fmt(rab)} RAB pour ${fmt(served)} servis). Un RAB régulier aide à limiter les restes.`,
    });
  }
  if (refusalRatePct != null) {
    facts.push({
      key: "refus",
      pill: "Taux de refus",
      title: `${fmt1(refusalRatePct)} %`,
      text: `${fmt(refused)} refus sur ${fmt(served)} assiettes servies. Un refus élevé peut signaler un plat peu adapté.`,
    });
  }

  if (wasteTotal > 0) {
    const matPct = Math.round((wasteMat / wasteTotal) * 100);
    const priPct = 100 - matPct;
    facts.push({
      key: "cycles",
      pill: "Par cycle",
      title: `Maternelle ${matPct} % · Primaire ${priPct} %`,
      text: `Répartition des ${(wasteTotal / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kg de déchets pesés entre maternelle et primaire.`,
    });
  }

  if (heaviest) {
    const hG = g100(heaviest);
    facts.push({
      key: "lourd",
      pill: "Jour le plus lourd",
      title: `${formatDayShort(heaviest.date)} · ${hG != null ? `${fmt(hG)} g / 100` : `${fmt1(heaviest.wasteWeightG / 1000)} kg`}`,
      text: "Journée où les g / 100 (ou le poids pesé) ont été les plus élevés. Utile pour revoir le menu de ce type de jour.",
    });
  }
  if (
    lightest &&
    heaviest &&
    lightest.date !== heaviest.date
  ) {
    const lG = g100(lightest);
    facts.push({
      key: "leger",
      pill: "Jour le plus léger",
      title: `${formatDayShort(lightest.date)} · ${lG != null ? `${fmt(lG)} g / 100` : `${fmt1(lightest.wasteWeightG / 1000)} kg`}`,
      text: "Repère utile : ce qui a bien fonctionné ce jour-là peut servir de modèle.",
    });
  }

  facts.push({
    key: "tendance",
    pill: "Tendance",
    title: trendLabel,
    text: trendHint,
  });

  if (streakAboveTarget >= 3) {
    facts.push({
      key: "alerte",
      pill: "Alerte",
      title: `${streakAboveTarget} jours de suite au-dessus de l’objectif`,
      text: "Revoir portions et menus dès le prochain service.",
    });
  }

  return {
    tone: status.tone,
    badge,
    lead: status.title,
    detail: status.detail,
    hint: status.hint,
    items: [
      { key: "waste", label: wasteLabel, hint: wasteHint },
      { key: "service", label: serviceLabel, hint: serviceHint },
      { key: "trend", label: trendLabel, hint: trendHint },
    ],
    facts,
  };
}
