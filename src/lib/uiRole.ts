export type UiEstablishmentRole = "ADMIN" | "KITCHEN";

function isAdminPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/antigaspillage") ||
    pathname.startsWith("/exports")
  );
}

function isKitchenPath(pathname: string): boolean {
  return (
    pathname === "/service" ||
    pathname.startsWith("/service/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  );
}

/** Chrome + nav : l’URL décide, pour ne pas habiller la cuisine en admin. */
export function shellRoleForPathname(
  pathname: string,
  sessionRole: UiEstablishmentRole,
): UiEstablishmentRole {
  if (isAdminPath(pathname)) return "ADMIN";
  if (isKitchenPath(pathname)) return "KITCHEN";
  return sessionRole;
}
