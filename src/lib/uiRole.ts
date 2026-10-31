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

/** Chrome + nav : l’URL admin l’emporte, un compte admin ne voit jamais Service. */
export function shellRoleForPathname(
  pathname: string,
  sessionRole: UiEstablishmentRole,
): UiEstablishmentRole {
  if (sessionRole === "ADMIN" || isAdminPath(pathname)) return "ADMIN";
  if (isKitchenPath(pathname)) return "KITCHEN";
  return sessionRole;
}

export function adminShouldLeaveKitchenPath(pathname: string): boolean {
  return isKitchenPath(pathname);
}
