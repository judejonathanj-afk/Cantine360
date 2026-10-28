import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildMealFlowSeries,
  type MealFlowDayInput,
} from "@/lib/buildMealFlowSeries";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

export function downloadMealFlowPdf(
  mealFlowByLevel: Record<SchoolLevel, MealFlowDayInput[]>,
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
  doc.text("Cantine360 — Flux du repas", 14, 14);
  doc.setFontSize(10);
  doc.text(
    `${filterLabel} · ${opts.days} derniers jours · exporté le ${today}`,
    14,
    20,
  );

  let startY = 28;
  for (const level of levels) {
    const series = buildMealFlowSeries(mealFlowByLevel[level] ?? []);
    doc.setFontSize(12);
    doc.text(schoolLevelLabelFr(level), 14, startY);
    autoTable(doc, {
      startY: startY + 3,
      head: [["Date", "Présents", "Servis", "RAB", "Refus"]],
      body: series.map((point) => [
        point.date,
        point.present.toLocaleString("fr-FR"),
        point.served.toLocaleString("fr-FR"),
        point.rab.toLocaleString("fr-FR"),
        point.refused.toLocaleString("fr-FR"),
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
  doc.save(`cantine360-flux-repas-${levelSlug}-${opts.days}j.pdf`);
}
