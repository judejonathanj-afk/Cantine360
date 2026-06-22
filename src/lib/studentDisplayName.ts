/** Affichage cuisine : prénom + nom complet (accès authentifié uniquement). */
export function formatStudentKitchenName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`;
}

/** Vue compacte service : prénom + initiale du nom. */
export function formatStudentCompactName(firstName: string, lastName: string) {
  const initial = lastName.trim().charAt(0);
  return initial ? `${firstName.trim()} ${initial}.` : firstName.trim();
}
