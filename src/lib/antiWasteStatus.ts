export type AntiWasteStatusTone = "ok" | "watch" | "alert" | "none";

export type AntiWasteStatus = {
  tone: AntiWasteStatusTone;
  /** Court libellé (badge / accessibilité). */
  label: string;
  /** Phrase principale lisible. */
  title: string;
  /** Explication du chiffre. */
  detail: string;
  /** Conseil d’action. */
  hint: string;
};

function formatG100(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

/** Vert ≤ objectif · Orange ≤ 1,25× · Rouge au-delà. */
export function antiWasteStatus(
  gramsPer100: number | null,
  targetGPer100: number | null,
): AntiWasteStatus {
  if (gramsPer100 == null || gramsPer100 <= 0) {
    return {
      tone: "none",
      label: "Pas encore de pesée",
      title: "Pas encore de pesée sur la période",
      detail:
        "Le chiffre « g / 100 assiettes » compare le poids des déchets au nombre d’assiettes servies. Il apparaîtra dès qu’une pesée et des services seront saisis.",
      hint: "En fin de service, renseignez les déchets maternelle / primaire pour activer ce suivi.",
    };
  }

  const g = formatG100(gramsPer100);
  const approxKg = (gramsPer100 / 1000).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });

  if (targetGPer100 == null || targetGPer100 <= 0) {
    return {
      tone: "watch",
      label: `${g} g / 100 — définir un objectif`,
      title: `En moyenne : ${g} g de déchets pour 100 assiettes`,
      detail: `Sur la période choisie, pour 100 repas servis, environ ${approxKg} kg de nourriture ont été jetés (reste assiette, pain, etc.).`,
      hint: "Définissez un objectif ci-dessus (ex. 80 g / 100 assiettes) pour savoir si vous êtes dans le vert, l’orange ou le rouge.",
    };
  }

  const target = formatG100(targetGPer100);
  const base = {
    detail: `Sur la période, pour 100 assiettes servies, on jette en moyenne ${g} g (soit ~${approxKg} kg). L’objectif fixé est ${target} g / 100 assiettes.`,
  };

  if (gramsPer100 <= targetGPer100) {
    return {
      tone: "ok",
      label: `Sous l’objectif (${target} g / 100)`,
      title: `Dans l’objectif : ${g} g / 100 assiettes`,
      ...base,
      hint: `Vous êtes sous ou à l’objectif (${target} g / 100). Maintenez les portions adaptées et les pesées régulières.`,
    };
  }

  if (gramsPer100 <= targetGPer100 * 1.25) {
    return {
      tone: "watch",
      label: `Au-dessus de l’objectif (${target} g / 100)`,
      title: `Légèrement au-dessus : ${g} g / 100 assiettes`,
      ...base,
      hint: `Objectif ${target} g / 100 — réduisez un peu les portions, surtout en maternelle, et encouragez le RAB.`,
    };
  }

  return {
    tone: "alert",
    label: `Bien au-dessus de l’objectif (${target} g / 100)`,
    title: `Bien au-dessus de l’objectif : ${g} g / 100 assiettes`,
    ...base,
    hint: `Objectif ${target} g / 100 — revoir le service (portions plus petites, menus qui génèrent trop de déchets).`,
  };
}
