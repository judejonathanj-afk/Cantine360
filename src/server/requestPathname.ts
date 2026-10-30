/** Chemin de la requête côté serveur (middleware + en-têtes Next). */
export function pathnameFromHeaders(h: Headers): string {
  const candidates = [
    h.get("x-pathname"),
    h.get("x-cantine-pathname"),
    h.get("next-url"),
  ];
  for (const raw of candidates) {
    const path = pathOnly(raw);
    if (path) return path;
  }
  return "";
}

function pathOnly(value: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const path = new URL(trimmed).pathname;
      return path.startsWith("/") ? path : "";
    }
  } catch {
    return "";
  }
  const path = trimmed.split("?")[0] ?? "";
  if (!path.startsWith("/") || path.startsWith("//")) return "";
  return path;
}
