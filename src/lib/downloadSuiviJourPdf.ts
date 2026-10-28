import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

function cell(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  return String(value);
}

function formatDelta(value: number | null) {
  if (value == null) return "—";
  if (value === 0) return "0";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("fr-FR")}`;
}

export function downloadSuiviJourPdf(
  rows: DashboardDayDetailRow[],
  opts: {
    days: 7 | 30;
    levelFilter: "all" | SchoolLevel;
    isKitchen?: boolean;
    section?: "suivi" | "contexte" | "all";
  },
) {
  const section = opts.section ?? "all";
  const includeSuivi = section === "suivi" || section === "all";
  const includeContexte =
    (section === "contexte" || section === "all") && !opts.isKitchen;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const levelLabel =
    opts.levelFilter === "all" ? "Tous niveaux" : schoolLevelLabelFr(opts.levelFilter);
  const today = new Date().toLocaleDateString("fr-FR");
  const heading =
    section === "contexte"
      ? "Cantine360 — Contexte du service"
      : "Cantine360 — Suivi jour par jour";

  doc.setFontSize(14);
  doc.text(heading, 14, 14);
  doc.setFontSize(10);
  doc.text(
    `${levelLabel} · ${opts.days} derniers jours · exporté le ${today}`,
    14,
    20,
  );
  doc.setFontSize(11);
  doc.text(
    section === "contexte"
      ? "Menus, pesées et écarts"
      : opts.isKitchen
        ? "Aperçu du jour"
        : "Détails par service",
    14,
    26,
  );

  const detailsHead = [
    [
      "Date",
      "Présents",
      "Servis",
      "RAB",
      "RAB %",
      "Refus",
      "Refus %",
      ...(opts.levelFilter === "all"
        ? ["Déchets mat. (g)", "Déchets prim. (g)"]
        : []),
      "Déchets (g)",
    ],
  ];

  const detailsBody = rows.map((row) => [
    row.date,
    cell(row.present.toLocaleString("fr-FR")),
    cell(row.served.toLocaleString("fr-FR")),
    cell(row.rab.toLocaleString("fr-FR")),
    row.rabRatePct != null ? `${row.rabRatePct.toLocaleString("fr-FR")} %` : "—",
    cell(row.refused.toLocaleString("fr-FR")),
    row.refusalRatePct != null
      ? `${row.refusalRatePct.toLocaleString("fr-FR")} %`
      : "—",
    ...(opts.levelFilter === "all"
      ? [
          row.wasteWeightMaternelleG > 0
            ? row.wasteWeightMaternelleG.toLocaleString("fr-FR")
            : "—",
          row.wasteWeightPrimaireG > 0
            ? row.wasteWeightPrimaireG.toLocaleString("fr-FR")
            : "—",
        ]
      : []),
    row.wasteWeightG > 0 ? row.wasteWeightG.toLocaleString("fr-FR") : "—",
  ]);

  if (includeSuivi) {
    autoTable(doc, {
      startY: 30,
      head: detailsHead,
      body: detailsBody,
      styles: { fontSize: 7, cellPadding: 1.2 },
      headStyles: { fillColor: [14, 165, 233], textColor: 255 },
      margin: { left: 10, right: 10 },
    });
  }

  if (includeContexte) {
    const afterDetails = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY;
    const contextStart = includeSuivi ? (afterDetails ?? 26) + 10 : 30;

    if (includeSuivi) {
      doc.setFontSize(12);
      doc.text(`Contexte du service — ${levelLabel}`, 14, contextStart);
    }

    autoTable(doc, {
      startY: includeSuivi ? contextStart + 4 : 30,
      head: [
        [
          "Date",
          "g / 100",
          "Pesée",
          "Écoles",
          "Classes",
          "Menu",
          "Élèves concernés",
          "Δ servis",
          "Δ déchets",
        ],
      ],
      body: rows.map((row) => [
        row.date,
        row.wasteGramsPer100 != null
          ? row.wasteGramsPer100.toLocaleString("fr-FR", { maximumFractionDigits: 1 })
          : "—",
        row.weighLabel,
        row.schools,
        cell(row.classCount),
        row.menuSummary,
        row.concernedStudents > 0
          ? row.concernedStudents.toLocaleString("fr-FR")
          : "—",
        formatDelta(row.servedDelta),
        formatDelta(row.wasteDelta),
      ]),
      styles: { fontSize: 7, cellPadding: 1.2 },
      headStyles: { fillColor: [194, 24, 91], textColor: 255 },
      columnStyles: {
        3: { cellWidth: 35 },
        5: { cellWidth: 55 },
      },
      margin: { left: 10, right: 10 },
    });
  }

  const levelSlug =
    opts.levelFilter === "all" ? "tous" : opts.levelFilter.toLowerCase();
  const fileStem =
    section === "contexte" ? "contexte-service" : "suivi-jour";
  doc.save(`cantine360-${fileStem}-${levelSlug}-${opts.days}j.pdf`);
}
