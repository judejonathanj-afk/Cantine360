import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

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
if (url.hostname.includes("pooler.supabase.com") && url.port === "6543") {
  url.port = "5432";
  url.searchParams.set("pgbouncer", "true");
  process.env.DATABASE_URL = url.toString();
}

execSync("prisma migrate deploy", { stdio: "inherit", env: process.env });
