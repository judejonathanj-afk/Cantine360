import { describe, expect, it } from "vitest";
import { mapPreviousPresentCounts } from "@/server/copyPreviousAttendance";

describe("mapPreviousPresentCounts", () => {
  it("copie les présents des groupes communs", () => {
    const updates = mapPreviousPresentCounts(
      ["g1", "g2", "g3"],
      [
        { groupId: "g1", presentCount: 25 },
        { groupId: "g2", presentCount: 23 },
      ],
    );
    expect(updates).toEqual([
      { groupId: "g1", presentCount: 25 },
      { groupId: "g2", presentCount: 23 },
    ]);
  });

  it("ignore les classes absentes du service précédent", () => {
    const updates = mapPreviousPresentCounts(["g-new"], [{ groupId: "g-old", presentCount: 20 }]);
    expect(updates).toEqual([]);
  });
});
