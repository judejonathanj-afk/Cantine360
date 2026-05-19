import {
  normalizeEstablishmentSlug,
  slugFromEstablishmentName,
} from "@/lib/establishmentSlug";

export function normalizeEstablishmentPin(raw: string) {
  return raw.replace(/\D/g, "");
}

export function validateEstablishmentPins(adminPin: string, kitchenPin: string) {
  if (adminPin.length < 4 || kitchenPin.length < 4) {
    return "Les codes admin et cuisine doivent contenir au moins 4 chiffres.";
  }
  if (adminPin === kitchenPin) {
    return "Les codes admin et cuisine doivent être différents.";
  }
  return null;
}

export function resolveEstablishmentSlug(name: string, slugInput?: string) {
  const slug =
    normalizeEstablishmentSlug(slugInput ?? "") || slugFromEstablishmentName(name);
  if (slug.length < 2) {
    return { error: "Code établissement trop court (2 caractères minimum)." as const };
  }
  return { slug };
}
