import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { MissingWeighServiceRow } from "@/app/(authed)/antigaspillage/AntiWastePanels";

function pdfNumber(value: number) {
  const rounded = Math.round(value).toString();
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function downloadMissingWeighPdf(
  services: MissingWeighServiceRow[],
  days: 7 | 30,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("fr-FR");

  doc.setFontSize(16);
  doc.text("Cantine360 — Services sans pesée", 14, 16);
  doc.setFontSize(11);
  doc.text(
    `${services.length} service${services.length > 1 ? "s" : ""} · période : ${days} jours · exporté le ${today}`,
    14,
    24,
  );

  const body =
    services.length === 0
      ? [["—", "—", "Aucun service sans pesée sur la période.", "—", "—"]]
      : services.map((service) => [
          service.dateLabel,
          service.mealLabel,
          service.menuSummary || "Menu non renseigné",
          service.servedCount > 0
            ? `${pdfNumber(service.servedCount)} assiette${service.servedCount > 1 ? "s" : ""}`
            : "—",
          "Pesée manquante",
        ]);

  autoTable(doc, {
    startY: 30,
    head: [["Date", "Repas", "Menu", "Assiettes", "Pesée"]],
    body,
    styles: { fontSize: 10, cellPadding: 3, textColor: 20, overflow: "linebreak" },
    headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: "bold" },
    margin: { left: 12, right: 12 },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 28 },
      3: { cellWidth: 32 },
      4: { cellWidth: 40 },
    },
  });

  doc.save(`cantine360-services-sans-pesee-${days}j.pdf`);
}
