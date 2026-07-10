/** ID du service ouvert depuis une URL `/service/[serviceId]`. */
export function activeServiceIdFromPathname(pathname: string): string | null {
  return pathname.match(/^\/service\/([^/]+)/)?.[1] ?? null;
}

export function isServiceSessionPathname(pathname: string): boolean {
  return activeServiceIdFromPathname(pathname) != null;
}
