import { NextResponse } from "next/server";
import { db } from "@/server/db";

function guardSecretConfigured(): string | null {
  const secret = process.env.CANTINE_GUARD_SECRET?.trim();
  return secret && secret.length >= 16 ? secret : null;
}

function authorized(req: Request, secret: string): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length).trim();
  if (!token || token.length !== secret.length) return false;
  let mismatch = 0;
  for (let i = 0; i < secret.length; i++) {
    mismatch |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function GET(req: Request) {
  const secret = guardSecretConfigured();
  if (!secret) {
    return NextResponse.json(
      { error: "Cantine Guard non configuré (CANTINE_GUARD_SECRET)." },
      { status: 503 },
    );
  }
  if (!authorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  let dbOk = false;
  let establishmentCount: number | null = null;
  let dbError: string | null = null;

  try {
    establishmentCount = await db.establishment.count();
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }

  const latencyMs = Date.now() - started;
  const ok = dbOk;

  return NextResponse.json(
    {
      ok,
      ts: new Date().toISOString(),
      latencyMs,
      db: { ok: dbOk, establishmentCount, error: dbError },
      deploy: {
        commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
        env: process.env.VERCEL_ENV ?? null,
      },
    },
    { status: ok ? 200 : 503 },
  );
}
