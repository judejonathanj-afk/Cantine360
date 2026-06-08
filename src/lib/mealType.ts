/** Cantine maternelle / primaire : service unique à midi. */
export const SCHOOL_MEAL_TYPE = "LUNCH" as const;

export type SchoolMealType = typeof SCHOOL_MEAL_TYPE;

export function mealTypeLabelFr(mealType: string) {
  return mealType === "DINNER" ? "Dîner" : "Déjeuner";
}
