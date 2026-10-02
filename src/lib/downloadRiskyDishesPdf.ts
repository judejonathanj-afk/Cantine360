import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { RiskyDishRow } from "@/lib/antiWasteRiskyDishes";

function pdfNumber(value: number) {
  const rounded = Math.round(value).toString();
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function g100(value: number | null | undefined) {
  if (value == null) return "—";
  return `${pdfNumber(value)} g/100`;
}

function dishTitle(label: string) {
  return label.replace(/\p{L}+/gu, (word) => {
    return word.charAt(0).toLocaleUpperCase("fr-FR") + word.slice(1);
  });
}

function vsLabel(value: RiskyDishRow["vsTarget"]) {
  if (value === "above") return "Au-dessus objectif";
  if (value === "ok") return "Sous objectif";
  return "Sans objectif";
}

function classesLabel(dish: RiskyDishRow) {
  const rows = dish.topClasses ?? [];
  if (rows.length === 0) return "—";
  return rows
    .map((row) => {
      const level = row.level === "MATERNELLE" ? "Maternelle" : "Primaire";
      return `${row.label} - ${level} - ${pdfNumber(row.wasteG)} g`;
    })
    .join("\n");
}

export function downloadRiskyDishesPdf(dishes: RiskyDishRow[], days: 7 | 30) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR");

  doc.setFontSize(16);
  doc.text("Cantine360 — Plats à risque", 14, 16);
  doc.setFontSize(11);
  doc.text(`Période : ${days} jours · exporté le ${today}`, 14, 24);

  const body =
    dishes.length === 0
      ? [["—", "Pas encore de plat à risque sur la période.", "—", "—", "—", "—", "—", "—"]]
      : dishes.map((dish, index) => [
          String(index + 1),
          dishTitle(dish.label),
          String(dish.serviceCount),
          g100(dish.avgWasteGPer100),
          vsLabel(dish.vsTarget),
          g100(dish.maternelleGPer100),
          g100(dish.primaireGPer100),
          classesLabel(dish),
        ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Rang",
        "Plat",
        "Services",
        "g / 100",
        "Objectif",
        "Maternelle",
        "Primaire",
        "Classes qui gaspillent le plus",
      ],
    ],
    body,
    styles: { fontSize: 9, cellPadding: 2, textColor: 20 },
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: "bold" },
    margin: { left: 12, right: 12 },
    columnStyles: {
      0: { cellWidth: 16 },
      2: { cellWidth: 22 },
    },
  });

  doc.save(`cantine360-plats-a-risque-${days}j.pdf`);
}
