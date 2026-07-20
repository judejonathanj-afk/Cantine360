type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Fenêtre glissante / fixe courte : trop d’essais PIN → 429. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 12;

function pruneExpired(now: number) {
  if (buckets.size < 500) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/**
 * Rate limit en mémoire par instance (serverless : chaque instance a son compteur).
 * Suffisant pour freiner le brute-force PIN ; à remplacer par Redis/KV si besoin plus tard.
 */
export function consumeLoginAttempt(key: string): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { ok: true, remaining: MAX_ATTEMPTS - existing.count };
}

/** Après un login réussi, on efface le compteur pour ce couple IP+cible. */
export function clearLoginAttempts(key: string) {
  buckets.delete(key);
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return "unknown";
}

/** Exposé pour les tests. */
export function __resetLoginRateLimitForTests() {
  buckets.clear();
}

export const LOGIN_RATE_LIMIT = {
  windowMs: WINDOW_MS,
  maxAttempts: MAX_ATTEMPTS,
} as const;
