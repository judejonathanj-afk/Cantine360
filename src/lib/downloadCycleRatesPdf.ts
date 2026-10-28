import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildLevelRateBars,
  type LevelMealTotals,
} from "@/lib/buildLevelComparisonSeries";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

export function downloadCycleRatesPdf(
  totalsByLevel: Record<SchoolLevel, LevelMealTotals>,
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
  doc.text("Cantine360 — Taux du cycle", 14, 14);
  doc.setFontSize(10);
  doc.text(
    `${filterLabel} · ${opts.days} derniers jours · exporté le ${today}`,
    14,
    20,
  );

  let startY = 28;
  for (const level of levels) {
    const totals = totalsByLevel[level];
    const bars = buildLevelRateBars(totals);
    doc.setFontSize(12);
    doc.text(schoolLevelLabelFr(level), 14, startY);
    autoTable(doc, {
      startY: startY + 3,
      head: [["Indicateur", "Taux", "Présents", "Servis", "RAB", "Refus"]],
      body: [
        [
          bars[0]?.metric ?? "Taux de service",
          `${(bars[0]?.rate ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`,
          totals.present.toLocaleString("fr-FR"),
          totals.served.toLocaleString("fr-FR"),
          totals.rab.toLocaleString("fr-FR"),
          totals.refused.toLocaleString("fr-FR"),
        ],
        [
          bars[1]?.metric ?? "Taux RAB",
          `${(bars[1]?.rate ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`,
          "—",
          "—",
          "—",
          "—",
        ],
        [
          bars[2]?.metric ?? "Taux refus",
          `${(bars[2]?.rate ?? 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`,
          "—",
          "—",
          "—",
          "—",
        ],
      ],
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
  doc.save(`cantine360-taux-cycle-${levelSlug}-${opts.days}j.pdf`);
}
