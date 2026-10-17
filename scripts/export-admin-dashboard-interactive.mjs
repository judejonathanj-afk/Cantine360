/**
 * Ouvre Chromium : connecte-toi (anne-frank + code admin), puis capture pleine page.
 */
import { mkdirSync, copyFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { chromium } from "playwright";

const BASE = "https://cantine360.vercel.app";
const OUT_VITRINE = resolve(
  process.cwd(),
  "cantine360-vitrine/apps/web/public/marketing/cantine360-dashboard-admin.png",
);
const OUT_FEATURES = resolve(
  process.cwd(),
  "public/features/cantine360-dashboard-admin-anne-frank.png",
);
const OUT_DOWNLOADS = join(
  homedir(),
  "Downloads/cantine360-dashboard-admin.png",
);

console.log("Une fenêtre Chromium va s’ouvrir.");
console.log("1) Code établissement : anne-frank");
console.log("2) Code accès admin → Se connecter");
console.log("3) Attends le tableau de bord complet (jusqu’à 5 min)…");

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto(`${BASE}/login?next=/admin/dashboard`, {
  waitUntil: "domcontentloaded",
});

try {
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 300_000 });
} catch {
  console.error("Timeout : pas de redirection vers /admin/dashboard.");
  await browser.close();
  process.exit(1);
}

await page
  .locator(".dashboard-v2, .dashboard-v2--admin")
  .first()
  .waitFor({ timeout: 120_000 })
  .catch(() =>
    page.getByRole("heading", { name: /Bienvenue/i }).first().waitFor({ timeout: 30_000 }),
  );
await page.waitForLoadState("networkidle", { timeout: 120_000 }).catch(() => {});
await page.waitForTimeout(2500);

mkdirSync(resolve(OUT_VITRINE, ".."), { recursive: true });
mkdirSync(resolve(OUT_FEATURES, ".."), { recursive: true });
mkdirSync(resolve(OUT_DOWNLOADS, ".."), { recursive: true });

await page.screenshot({
  path: OUT_VITRINE,
  fullPage: true,
  type: "png",
});

copyFileSync(OUT_VITRINE, OUT_FEATURES);
copyFileSync(OUT_VITRINE, OUT_DOWNLOADS);

const dims = await page.evaluate(() => ({
  w: document.documentElement.scrollWidth,
  h: document.documentElement.scrollHeight,
}));

console.log(
  JSON.stringify({
    ok: true,
    size: dims,
    outputs: [OUT_VITRINE, OUT_FEATURES, OUT_DOWNLOADS],
  }),
);

await browser.close();
