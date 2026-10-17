/**
 * Convertit la capture PNG du dashboard en PDF (page unique, proportions conservées).
 *
 * Entrée : cantine360-vitrine/.../cantine360-dashboard-admin.png (ou 1er arg)
 * Sortie : ~/Downloads/cantine360-dashboard-admin.pdf
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { jsPDF } from "jspdf";

const defaultPng = resolve(
  process.cwd(),
  "cantine360-vitrine/apps/web/public/marketing/cantine360-dashboard-admin-full.png",
);
const pngPath = process.argv[2] ? resolve(process.argv[2]) : defaultPng;
const outPdf = join(homedir(), "Downloads/cantine360-dashboard-admin.pdf");

if (!existsSync(pngPath)) {
  console.error("PNG introuvable :", pngPath);
  process.exit(1);
}

const pngBytes = readFileSync(pngPath);
const b64 = pngBytes.toString("base64");
const dataUrl = `data:image/png;base64,${b64}`;

// Dimensions via PNG IHDR (bytes 16–23)
const wPx = pngBytes.readUInt32BE(16);
const hPx = pngBytes.readUInt32BE(20);

const pageWidthMm = 210;
const pageHeightMm = (hPx / wPx) * pageWidthMm;

const doc = new jsPDF({
  unit: "mm",
  format: [pageWidthMm, pageHeightMm],
  compress: true,
});

doc.addImage(dataUrl, "PNG", 0, 0, pageWidthMm, pageHeightMm, undefined, "FAST");
doc.save(outPdf);

console.log(
  JSON.stringify({
    ok: true,
    from: pngPath,
    pdf: outPdf,
    pageMm: { w: pageWidthMm, h: Math.round(pageHeightMm * 10) / 10 },
    pixels: { w: wPx, h: hPx },
  }),
);
