import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildWasteEvolutionSeries,
  type WastePerDayRowInput,
} from "@/lib/buildWasteEvolutionSeries";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

export function downloadWasteEvolutionPdf(
  wasteByLevel: Record<SchoolLevel, WastePerDayRowInput[]>,
  levels: SchoolLevel[],
  opts: {
    days: 7 | 30;
    levelFilter: "all" | SchoolLevel;
  },
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const filterLabel =
    opts.levelFilter === "all" ? "Tous niveaux" : schoolLevelLabelFr(opts.levelFilter);
  const today = new Date().toLocaleDateString("fr-FR");

  doc.setFontSize(14);
  doc.text("Cantine360 — Évolution des déchets", 14, 14);
  doc.setFontSize(10);
  doc.text(
    `${filterLabel} · ${opts.days} derniers jours · exporté le ${today}`,
    14,
    20,
  );

  let startY = 28;
  for (const level of levels) {
    const series = buildWasteEvolutionSeries(wasteByLevel[level] ?? []);
    doc.setFontSize(12);
    doc.text(schoolLevelLabelFr(level), 14, startY);
    autoTable(doc, {
      startY: startY + 3,
      head: [["Date", "Déchets (g)", "g / 100 assiettes"]],
      body: series.map((point) => [
        point.date,
        point.wasteWeightG > 0
          ? Math.round(point.wasteWeightG).toLocaleString("fr-FR")
          : "—",
        point.gramsPer100Served != null
          ? point.gramsPer100Served.toLocaleString("fr-FR", {
              maximumFractionDigits: 1,
            })
          : "—",
      ]),
      styles: { fontSize: 8, cellPadding: 1.4 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      margin: { left: 10, right: 10 },
    });
    const after = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY;
    startY = (after ?? startY) + 12;
  }

  const levelSlug =
    opts.levelFilter === "all" ? "tous" : opts.levelFilter.toLowerCase();
  doc.save(`cantine360-evolution-dechets-${levelSlug}-${opts.days}j.pdf`);
}
