/**
 * Cantine Guard — sonde prod (VPS, cron systemd toutes les 30 min).
 * Variables : GUARD_BASE_URL, CANTINE_GUARD_SECRET, SLACK_WEBHOOK_URL (opt),
 * GUARD_STATE_PATH, GUARD_REPORT_PATH, GUARD_LOGIN_PATH.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const BASE = (process.env.GUARD_BASE_URL ?? "https://cantine360.vercel.app").replace(
  /\/$/,
  "",
);
const SECRET = process.env.CANTINE_GUARD_SECRET?.trim() ?? "";
const SLACK = process.env.SLACK_WEBHOOK_URL?.trim() ?? "";
const LOGIN_PATH = process.env.GUARD_LOGIN_PATH ?? "/login";
const STATE_PATH =
  process.env.GUARD_STATE_PATH ?? "/var/lib/cantine-guard/last-state.json";
const REPORT_PATH =
  process.env.GUARD_REPORT_PATH ?? "/var/lib/cantine-guard/last-report.json";

const checks = [];

function pass(name, detail = "") {
  checks.push({ name, status: "PASS", detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  checks.push({ name, status: "FAIL", detail: String(detail) });
  console.error(`FAIL  ${name} — ${detail}`);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 25_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function ensureParent(filePath) {
  try {
    mkdirSync(dirname(filePath), { recursive: true });
  } catch {
    /* ignore */
  }
}

function readState() {
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { lastOverall: null };
  }
}

function writeState(state) {
  ensureParent(STATE_PATH);
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function writeReport(report) {
  ensureParent(REPORT_PATH);
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

async function notifySlack(text) {
  if (!SLACK) return;
  try {
    const res = await fetchWithTimeout(
      SLACK,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      },
      15_000,
    );
    if (!res.ok) {
      console.error(`Slack webhook status ${res.status}`);
    }
  } catch (e) {
    console.error("Slack webhook error", e?.message ?? e);
  }
}

async function main() {
  const startedAt = new Date().toISOString();

  if (!SECRET || SECRET.length < 16) {
    console.error("CANTINE_GUARD_SECRET manquant ou trop court (min 16 caractères).");
    process.exit(2);
  }

  // 1) Page login / edge
  try {
    const res = await fetchWithTimeout(`${BASE}${LOGIN_PATH}`, { redirect: "manual" });
    if (res.status >= 200 && res.status < 500) {
      pass("HTTP login", `status=${res.status}`);
    } else {
      fail("HTTP login", `status=${res.status}`);
    }
  } catch (e) {
    fail("HTTP login", e?.message ?? e);
  }

  // 2) Health API (DB + déploiement)
  try {
    const res = await fetchWithTimeout(`${BASE}/api/cantine-guard/health`, {
      headers: { authorization: `Bearer ${SECRET}` },
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* raw */
    }
    if (res.status === 200 && json?.ok === true) {
      const n = json.db?.establishmentCount;
      pass(
        "API health",
        `latency=${json.latencyMs}ms étab=${n ?? "?"} commit=${json.deploy?.commit ?? "?"}`,
      );
    } else {
      fail(
        "API health",
        `status=${res.status} body=${text.slice(0, 240)}`,
      );
    }
  } catch (e) {
    fail("API health", e?.message ?? e);
  }

  const failed = checks.filter((c) => c.status === "FAIL").length;
  const overall = failed === 0 ? "ok" : "fail";
  const finishedAt = new Date().toISOString();

  const report = {
    startedAt,
    finishedAt,
    baseUrl: BASE,
    overall,
    failed,
    checks,
  };
  writeReport(report);

  const prev = readState();
  writeState({ lastOverall: overall, at: finishedAt, failed });

  if (overall === "fail" && prev.lastOverall !== "fail") {
    const lines = checks
      .filter((c) => c.status === "FAIL")
      .map((c) => `• ${c.name}: ${c.detail}`)
      .join("\n");
    await notifySlack(
      `:rotating_light: *Cantine Guard* — incident sur ${BASE}\n${lines}\n_${finishedAt}_`,
    );
  } else if (overall === "ok" && prev.lastOverall === "fail") {
    await notifySlack(
      `:white_check_mark: *Cantine Guard* — rétabli sur ${BASE}\n_${finishedAt}_`,
    );
  }

  console.log(JSON.stringify({ overall, failed, reportPath: REPORT_PATH }, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
