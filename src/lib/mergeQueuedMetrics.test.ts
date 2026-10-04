import { describe, expect, it } from "vitest";
import { overlayQueuedCounts } from "@/lib/mergeQueuedMetrics";

describe("overlayQueuedCounts", () => {
  it("remplace seulement les classes en attente", () => {
    const rows = overlayQueuedCounts(
      [
        {
          groupId: "a",
          presentCount: 1,
          servedCount: 1,
          rabCount: 0,
          refusedCount: 0,
        },
        {
          groupId: "b",
          presentCount: 4,
          servedCount: 4,
          rabCount: 0,
          refusedCount: 0,
        },
      ],
      [
        {
          groupId: "a",
          metrics: {
            presentCount: 20,
            servedCount: 18,
            rabCount: 1,
            refusedCount: 2,
          },
        },
      ],
    );
    expect(rows[0]).toMatchObject({
      presentCount: 20,
      servedCount: 18,
      rabCount: 1,
      refusedCount: 2,
    });
    expect(rows[1]?.presentCount).toBe(4);
  });
});
