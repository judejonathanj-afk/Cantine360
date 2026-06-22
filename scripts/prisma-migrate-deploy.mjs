import "dotenv/config";
import { execSync } from "node:child_process";

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
