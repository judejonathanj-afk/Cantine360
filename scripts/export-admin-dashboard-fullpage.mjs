/**
 * Capture pleine page du tableau de bord admin (/admin/dashboard).
 *
 * Variables (ou .env) :
 *   EXPORT_DASHBOARD_BASE_URL — défaut https://cantine360.vercel.app
 *   EXPORT_DASHBOARD_SLUG     — défaut anne-frank
 *   EXPORT_DASHBOARD_ADMIN_PIN — code admin établissement (obligatoire)
 *
 * Sorties :
 *   cantine360-vitrine/apps/web/public/marketing/cantine360-dashboard-admin.png
 *   public/features/cantine360-dashboard-admin-anne-frank.png
 *   ~/Downloads/cantine360-dashboard-admin.png
 */
import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import { chromium } from "playwright";

function loadDotEnv() {
  const path = resolve(process.cwd(), ".env");
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}

loadDotEnv();

function readOptionalPinFile() {
  const path = resolve(process.cwd(), ".export-dashboard-pin");
  try {
    const pin = readFileSync(path, "utf8").trim();
    return pin.length >= 4 ? pin : "";
  } catch {
    return "";
  }
}

const BASE =
  process.env.EXPORT_DASHBOARD_BASE_URL?.replace(/\/$/, "") ??
  "https://cantine360.vercel.app";
const SLUG = process.env.EXPORT_DASHBOARD_SLUG ?? "anne-frank";
const PIN =
  process.env.EXPORT_DASHBOARD_ADMIN_PIN?.trim() ||
  process.env.SCREENSHOT_ADMIN_PIN?.trim() ||
  readOptionalPinFile();

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

if (!PIN) {
  console.error(
    "Code admin manquant : EXPORT_DASHBOARD_ADMIN_PIN dans .env, ou fichier .export-dashboard-pin (gitignore).",
  );
  process.exit(1);
}

async function loginEstablishment(pin) {
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      slug: SLUG,
      pin,
      next: "/admin/dashboard",
    }),
  });
  let loginJson;
  try {
    loginJson = await loginRes.json();
  } catch {
    loginJson = null;
  }
  return { loginRes, loginJson };
}

let { loginRes, loginJson } = await loginEstablishment(PIN);

if (!loginRes.ok || !loginJson?.redirectTo) {
  console.error(
    "Connexion refusée.",
    loginJson?.error ?? `HTTP ${loginRes.status}`,
  );
  process.exit(1);
}

function parseSetCookie(res) {
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

const cookies = parseSetCookie(loginRes).map((sc) => {
  const [pair, ...attrs] = sc.split(";").map((s) => s.trim());
  const eq = pair.indexOf("=");
  const name = pair.slice(0, eq);
  const value = pair.slice(eq + 1);
  const cookie = { name, value, url: BASE };
  for (const a of attrs) {
    const lower = a.toLowerCase();
    if (lower === "httponly") cookie.httpOnly = true;
    else if (lower === "secure") cookie.secure = true;
    else if (lower.startsWith("path=")) cookie.path = a.slice(5);
    else if (lower.startsWith("samesite=")) {
      cookie.sameSite = a.slice(9);
    }
  }
  return cookie;
});

if (!cookies.length) {
  console.error("Aucun cookie de session après login.");
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await context.addCookies(cookies);

const page = await context.newPage();
await page.goto(`${BASE}/admin/dashboard`, {
  waitUntil: "networkidle",
  timeout: 120_000,
});

const url = page.url();
if (url.includes("/login")) {
  console.error("Redirection vers /login — session invalide.");
  await browser.close();
  process.exit(1);
}

await page
  .locator(".dashboard-v2, .dashboard-v2--admin")
  .first()
  .waitFor({ timeout: 120_000 })
  .catch(() => {});
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
  scrollWidth: document.documentElement.scrollWidth,
  scrollHeight: document.documentElement.scrollHeight,
}));

console.log(
  JSON.stringify({
    ok: true,
    base: BASE,
    slug: SLUG,
    viewport: { width: 1440, height: 900 },
    page: dims,
    outputs: [OUT_VITRINE, OUT_FEATURES, OUT_DOWNLOADS],
  }),
);

await browser.close();
