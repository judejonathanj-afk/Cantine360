import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

if (!process.env.DATABASE_URL && existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key !== "DATABASE_URL" || process.env.DATABASE_URL) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env.DATABASE_URL = value;
  }
}

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL manquant dans .env");
  process.exit(1);
}

const url = new URL(raw);
console.log(
  `[prisma:deploy] Connexion vers ${url.hostname}:${url.port || "5432"}…`,
);

if (url.hostname.includes("pooler.supabase.com") && url.port === "6543") {
  url.port = "5432";
  url.searchParams.set("pgbouncer", "true");
  process.env.DATABASE_URL = url.toString();
  console.log("[prisma:deploy] Pooler 6543 → session 5432 (migrations).");
}

// Évite un hang infini si le DNS / réseau Supabase ne répond pas.
if (!process.env.PRISMA_SCHEMA_ENGINE_TIMEOUT) {
  process.env.PRISMA_SCHEMA_ENGINE_TIMEOUT = "20000";
}

const require = createRequire(import.meta.url);
const prismaCli = path.join(
  path.dirname(require.resolve("prisma/package.json")),
  "build",
  "index.js",
);

console.log("[prisma:deploy] prisma migrate deploy…");
try {
  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
  console.log("[prisma:deploy] OK");
} catch (e) {
  console.error(
    "[prisma:deploy] Échec. Vérifie le Wi‑Fi / VPN, puis réessaie. Si ça bloque encore, applique la migration SQL à la main sur Supabase.",
  );
  process.exit(typeof e?.status === "number" ? e.status : 1);
}
