import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetLoginRateLimitForTests,
  clearLoginAttempts,
  consumeLoginAttempt,
  LOGIN_RATE_LIMIT,
} from "@/server/loginRateLimit";

describe("loginRateLimit", () => {
  beforeEach(() => {
    __resetLoginRateLimitForTests();
  });

  it("autorise jusqu’à maxAttempts essais", () => {
    const key = "ip:test-slug";
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxAttempts; i++) {
      const r = consumeLoginAttempt(key);
      expect(r.ok).toBe(true);
    }
    const blocked = consumeLoginAttempt(key);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("réinitialise après succès", () => {
    const key = "ip:ok";
    for (let i = 0; i < LOGIN_RATE_LIMIT.maxAttempts; i++) {
      consumeLoginAttempt(key);
    }
    clearLoginAttempts(key);
    expect(consumeLoginAttempt(key).ok).toBe(true);
  });
});
