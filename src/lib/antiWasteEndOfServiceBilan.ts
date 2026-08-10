export type EndOfServiceBilanTip = {
  tone: "ok" | "watch" | "info";
  text: string;
};

/**
 * 3 conseils courts après la pesée — pour décider demain.
 */
export function buildEndOfServiceBilanTips(input: {
  wasteWeightG: number;
  served: number;
  rab: number;
  refused: number;
  targetGPer100: number | null;
  mainLabels: string[];
  allLabels: string[];
}): EndOfServiceBilanTip[] {
  const tips: EndOfServiceBilanTip[] = [];
  const g100 =
    input.served > 0 && input.wasteWeightG > 0
      ? (input.wasteWeightG / input.served) * 100
      : null;
  const rabPct =
    input.served > 0 ? (input.rab / input.served) * 100 : null;
  const refusPct =
    input.served > 0 ? (input.refused / input.served) * 100 : null;
  const target =
    input.targetGPer100 != null && input.targetGPer100 > 0
      ? input.targetGPer100
      : null;
  const dishHint =
    input.mainLabels[0]?.trim() ||
    input.allLabels.find((l) => l.trim())?.trim() ||
    null;

  // 1 — lecture du jour vs objectif
  if (g100 == null) {
    tips.push({
      tone: "info",
      text: "Pesée enregistrée — renseignez aussi les assiettes servies pour calculer les g / 100.",
    });
  } else if (target != null && g100 <= target) {
    tips.push({
      tone: "ok",
      text: `Aujourd’hui ${g100.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} g / 100 — dans l’objectif (${target} g / 100). Maintenir demain.`,
    });
  } else if (target != null) {
    tips.push({
      tone: "watch",
      text: `Aujourd’hui ${g100.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} g / 100 — au-dessus de l’objectif (${target}). Demain : portions plus petites, surtout en maternelle.`,
    });
  } else {
    tips.push({
      tone: "info",
      text: `Aujourd’hui ${g100.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} g / 100 assiettes. Fixez un objectif admin pour colorer le suivi.`,
    });
  }

  // 2 — RAB / refus / plat
  if (rabPct != null && rabPct >= 25) {
    tips.push({
      tone: "watch",
      text: `RAB élevé (${rabPct.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %) — demain servir moins d’entrée, laisser se resservir.`,
    });
  } else if (refusPct != null && refusPct >= 12) {
    tips.push({
      tone: "watch",
      text: `Refus élevés (${refusPct.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %) — vérifier si le menu plaît ; adapter les portions.`,
    });
  } else if (dishHint) {
    tips.push({
      tone: "info",
      text: `Plat du jour « ${dishHint} » — s’il revient, surveillez-le dans « Plats à risque » (page Antigaspillage).`,
    });
  } else {
    tips.push({
      tone: "info",
      text: "Complétez le menu (intitulés) pour relier demain ce service aux plats à risque.",
    });
  }

  // 3 — action concrète demain
  if (g100 != null && target != null && g100 > target * 1.25) {
    tips.push({
      tone: "watch",
      text: "Gaspillage nettement au-dessus — demain : petites portions + pesée mat. / prim. séparées.",
    });
  } else {
    tips.push({
      tone: "ok",
      text: "Demain : présents tôt, portions adaptées mat. / prim., pesée en fin de service.",
    });
  }

  return tips.slice(0, 3);
}
