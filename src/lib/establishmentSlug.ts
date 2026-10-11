/** Identifiant court saisi à la connexion (ex. `ecole-martin`). */
export function normalizeEstablishmentSlug(raw: string) {
  return raw
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugFromEstablishmentName(name: string) {
  return normalizeEstablishmentSlug(name);
}
