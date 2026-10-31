export type UiEstablishmentRole = "ADMIN" | "KITCHEN";

export function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/antigaspillage") ||
    pathname.startsWith("/exports")
  );
}

export function isKitchenPath(pathname: string): boolean {
  return (
    pathname === "/service" ||
    pathname.startsWith("/service/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  );
}

/** Chrome + nav : le rôle du jeton, jamais l’URL d’en face. */
export function shellRoleForPathname(
  _pathname: string,
  sessionRole: UiEstablishmentRole,
): UiEstablishmentRole {
  return sessionRole;
}
