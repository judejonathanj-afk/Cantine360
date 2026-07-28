import { describe, expect, it, beforeEach } from "vitest";
import {
  enqueueWasteSave,
  flushWasteQueue,
  getQueuedWaste,
  queuedWasteCount,
  removeQueuedWaste,
} from "@/lib/offlineWasteQueue";

describe("offlineWasteQueue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("conserve une saisie par service", () => {
    enqueueWasteSave("svc1", {
      wasteWeightMaternelleG: 1000,
      wasteWeightPrimaireG: 2000,
    });
    enqueueWasteSave("svc1", {
      wasteWeightMaternelleG: 1500,
      wasteWeightPrimaireG: 2500,
    });
    expect(queuedWasteCount()).toBe(1);
    expect(getQueuedWaste("svc1")?.waste.wasteWeightMaternelleG).toBe(1500);
  });

  it("supprime après sync réussie", async () => {
    enqueueWasteSave("svc1", {
      wasteWeightMaternelleG: 1000,
      wasteWeightPrimaireG: null,
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 })) as typeof fetch;
    try {
      const result = await flushWasteQueue();
      expect(result.synced).toBe(1);
      expect(queuedWasteCount()).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("garde la file si le serveur échoue", async () => {
    enqueueWasteSave("svc1", {
      wasteWeightMaternelleG: 1000,
      wasteWeightPrimaireG: 500,
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response("fail", { status: 500 })) as typeof fetch;
    try {
      const result = await flushWasteQueue();
      expect(result.failed).toBe(1);
      expect(queuedWasteCount()).toBe(1);
      removeQueuedWaste("svc1");
      expect(queuedWasteCount()).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
