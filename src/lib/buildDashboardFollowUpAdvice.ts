import { antiWasteStatus, type AntiWasteStatusTone } from "@/lib/antiWasteStatus";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";

export type FollowUpAdviceItem = {
  key: string;
  label: string;
  hint: string;
};

export type DashboardFollowUpAdvice = {
  tone: AntiWasteStatusTone;
  lead: string;
  badge: string;
  items: FollowUpAdviceItem[];
};

function formatDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
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

  if (!last) {
    return {
      tone: "none",
      badge: "En attente",
      lead: `Aucun service pesé sur ${days} jours — l’avis s’affichera dès la première saisie.`,
      items: [
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
      ],
    };
  }

  const lastKg = (last.wasteWeightG / 1000).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
  const wasteLabel =
    lastG != null
      ? `${Math.round(lastG).toLocaleString("fr-FR")} g / 100`
      : last.wasteWeightG > 0
        ? `${lastKg} kg jetés`
        : "Pesée encore vide";
  const wasteHint =
    lastG != null
      ? `Dernier service (${formatDay(last.date)}) : ${lastKg} kg de déchets.`
      : `Ouvrir le service du ${formatDay(last.date)} et enregistrer la pesée.`;

  const rab = last.rab;
  const refused = last.refused;
  const served = last.served;
  const serviceLabel =
    served > 0
      ? `${served.toLocaleString("fr-FR")} assiette${served > 1 ? "s" : ""}`
      : "Assiettes non saisies";
  const serviceHint =
    served > 0
      ? `RAB ${rab.toLocaleString("fr-FR")} · refus ${refused.toLocaleString("fr-FR")} sur le dernier service.`
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
      trendHint = `${Math.round(Math.abs(delta)).toLocaleString("fr-FR")} g / 100 de moins que le service d’avant.`;
    } else {
      trendLabel = "Tendance en hausse";
      trendHint = `${Math.round(delta).toLocaleString("fr-FR")} g / 100 de plus que le service d’avant.`;
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

  return {
    tone: status.tone,
    badge,
    lead: status.title,
    items: [
      { key: "waste", label: wasteLabel, hint: wasteHint },
      { key: "service", label: serviceLabel, hint: serviceHint },
      { key: "trend", label: trendLabel, hint: trendHint },
    ],
  };
}
