const nf = new Intl.NumberFormat("fr-FR");
const nf1 = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function fmt(n: number) {
  return nf.format(n);
}

export function fmt1(n: number) {
  return nf1.format(n);
}

export type GaugeStatus = "green" | "amber" | "red" | "none";

export function gaugeStatusFromTone(
  tone: "ok" | "watch" | "alert" | "none",
  hasValue: boolean,
  hasTarget: boolean,
): GaugeStatus {
  if (!hasValue) return "none";
  if (!hasTarget) return "none";
  if (tone === "ok") return "green";
  if (tone === "watch") return "amber";
  if (tone === "alert") return "red";
  return "none";
}

export const gaugeStatusLabel: Record<GaugeStatus, string> = {
  green: "Dans le vert",
  amber: "À surveiller",
  red: "Au-dessus du seuil",
  none: "Sans objectif",
};

export function formatDayLabelFr(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  return label.replace(/\.$/, "");
}

export function weighingStatusFromLabel(
  weighLabel: string,
): "both" | "missing" | "partial" {
  if (weighLabel === "Les deux" || weighLabel === "Pesée faite") return "both";
  if (
    weighLabel === "Manquante" ||
    weighLabel === "Pesée manquante" ||
    weighLabel.toLowerCase().includes("manqu")
  ) {
    return "missing";
  }
  return "partial";
}
