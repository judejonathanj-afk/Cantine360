import type { EstablishmentRole } from "@/server/auth-cookies";

function nextLooksSafe(next?: string): next is string {
  return (
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//")
  );
}

function nextIsKitchenArea(next: string): boolean {
  return (
    next === "/service" ||
    next.startsWith("/service/") ||
    next === "/dashboard" ||
    next.startsWith("/dashboard/")
  );
}

function nextIsAdminArea(next: string): boolean {
  return (
    next.startsWith("/admin") ||
    next.startsWith("/antigaspillage") ||
    next.startsWith("/exports")
  );
}

/** Un PIN qui ouvre les deux rôles : l’URL demandée tranche, pas l’admin par défaut. */
export function loginRoleFromPinMatch(
  adminOk: boolean,
  kitchenOk: boolean,
  next?: string,
): EstablishmentRole | null {
  if (!adminOk && !kitchenOk) return null;
  if (adminOk && !kitchenOk) return "ADMIN";
  if (!adminOk && kitchenOk) return "KITCHEN";
  if (nextLooksSafe(next) && nextIsKitchenArea(next)) return "KITCHEN";
  if (nextLooksSafe(next) && nextIsAdminArea(next)) return "ADMIN";
  return "ADMIN";
}
