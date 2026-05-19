/** Palette « Menus cantine » — une teinte par carte de groupe/classe */
export const GROUP_CARD_COLORS = [
  "#85C1E9",
  "#BB8FCE",
  "#F5B041",
  "#EC7063",
  "#ABEBC6",
  "#F9E79F",
  "#45B39D",
  "#F4D03F",
] as const;

export function groupCardColorForIndex(index: number): string {
  return GROUP_CARD_COLORS[index % GROUP_CARD_COLORS.length] ?? GROUP_CARD_COLORS[0];
}
