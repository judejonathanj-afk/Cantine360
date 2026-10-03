/** Une seconde tentative si la base est saturée au pic de midi (connexions, timeout). */
const TRANSIENT =
  /ECONNRESET|ETIMEDOUT|ECONNREFUSED|too many clients|timeout expired|Connection terminated|sorry, too many clients|P1001|P1008|P1017|P2024|53300/i;

function isTransient(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  const code =
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  return TRANSIENT.test(msg) || TRANSIENT.test(code);
}

export async function runDbWrite<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (!isTransient(e)) throw e;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return await fn();
  }
}
