/** ID du service ouvert depuis une URL `/service/[serviceId]`. */
export function activeServiceIdFromPathname(pathname: string): string | null {
  return pathname.match(/^\/service\/([^/]+)/)?.[1] ?? null;
}

export function isServiceSessionPathname(pathname: string): boolean {
  return activeServiceIdFromPathname(pathname) != null;
}

/** Conservé pendant l’onglet pour que Menu & Service restent après un refresh RSC hors `/service/[id]`. */
export const ACTIVE_SERVICE_STORAGE_KEY = "cantine360.activeServiceId";

export function readRememberedServiceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(ACTIVE_SERVICE_STORAGE_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function rememberActiveServiceId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) window.sessionStorage.setItem(ACTIVE_SERVICE_STORAGE_KEY, id);
    else window.sessionStorage.removeItem(ACTIVE_SERVICE_STORAGE_KEY);
  } catch {
    // private mode / quota — ignorer
  }
}
