import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildCantinePulseDailySeries,
  buildCantinePulseSituationConclusion,
  computeCantinePulse,
  type CantinePulseWindowDays,
  type CantineServiceRow,
  type CantineWasteDayRow,
} from "@/lib/cantinePulse";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

export function downloadCantinePlusPdf(
  rows: CantineServiceRow[],
  wasteRows: CantineWasteDayRow[],
  opts: {
    days: CantinePulseWindowDays;
    levelFilter: "all" | SchoolLevel;
    mealType?: string;
  },
) {
  const mealType = opts.mealType ?? "LUNCH";
  const pulse = computeCantinePulse(rows, mealType, {
    windowDays: opts.days,
    wasteRows,
  });
  const conclusion = buildCantinePulseSituationConclusion(pulse, {
    windowDays: opts.days,
  });
  const series = buildCantinePulseDailySeries(rows, mealType, {
    windowDays: opts.days,
    wasteRows,
  });

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const filterLabel =
    opts.levelFilter === "all" ? "Tous niveaux" : schoolLevelLabelFr(opts.levelFilter);
  const today = new Date().toLocaleDateString("fr-FR");
  const { curr } = pulse.meta;

  doc.setFontSize(14);
  doc.text("Cantine360 — Cantine+", 14, 14);
  doc.setFontSize(10);
  doc.text(
    `${filterLabel} · ${opts.days} derniers jours · exporté le ${today}`,
    14,
    20,
  );

  autoTable(doc, {
    startY: 26,
    head: [["Note", "Assiettes servies", "RAB", "Déchets (g)", "g / 100 assiettes"]],
    body: [
      [
        pulse.score != null ? `${pulse.score}/100` : "—",
        curr.served.toLocaleString("fr-FR"),
        curr.rab.toLocaleString("fr-FR"),
        curr.wasteWeightG > 0
          ? Math.round(curr.wasteWeightG).toLocaleString("fr-FR")
          : "—",
        curr.served > 0 && curr.wasteWeightG > 0
          ? curr.wasteGramsPer100Served.toLocaleString("fr-FR", {
              maximumFractionDigits: 1,
            })
          : "—",
      ],
    ],
    styles: { fontSize: 8, cellPadding: 1.4 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    margin: { left: 10, right: 10 },
  });

  let startY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 36;

  doc.setFontSize(10);
  const conclusionLines = doc.splitTextToSize(
    [conclusion.situation, conclusion.antiWaste].filter(Boolean).join(" "),
    270,
  );
  doc.text(conclusionLines, 14, startY + 8);
  startY += 8 + conclusionLines.length * 5;

  autoTable(doc, {
    startY: startY + 4,
    head: [["Date", "Servis", "RAB", "Déchets (g)", "g / 100 assiettes"]],
    body: series.map((point) => [
      point.date,
      point.served.toLocaleString("fr-FR"),
      point.rab.toLocaleString("fr-FR"),
      point.wasteWeightG > 0
        ? Math.round(point.wasteWeightG).toLocaleString("fr-FR")
        : "—",
      point.gramsPer100Waste != null
        ? point.gramsPer100Waste.toLocaleString("fr-FR", {
            maximumFractionDigits: 1,
          })
        : "—",
    ]),
    styles: { fontSize: 8, cellPadding: 1.4 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    margin: { left: 10, right: 10 },
  });

  const levelSlug =
    opts.levelFilter === "all" ? "tous" : opts.levelFilter.toLowerCase();
  doc.save(`cantine360-cantine-plus-${levelSlug}-${opts.days}j.pdf`);
}
