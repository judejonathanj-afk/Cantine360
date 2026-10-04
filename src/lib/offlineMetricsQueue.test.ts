/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  enqueueMetricsSave,
  flushMetricsQueue,
  getQueuedMetrics,
  listQueuedMetrics,
  queuedMetricsCount,
  removeQueuedMetrics,
} from "@/lib/offlineMetricsQueue";

const metrics = {
  presentCount: 25,
  servedCount: 20,
  rabCount: 1,
  refusedCount: 0,
};

describe("offlineMetricsQueue", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("met en file et remplace une saisie existante", () => {
    enqueueMetricsSave("svc1", "grp1", metrics);
    enqueueMetricsSave("svc1", "grp1", { ...metrics, servedCount: 22 });
    expect(queuedMetricsCount()).toBe(1);
    expect(getQueuedMetrics("svc1", "grp1")?.metrics.servedCount).toBe(22);
  });

  it("liste plusieurs classes", () => {
    enqueueMetricsSave("svc1", "grp1", metrics);
    enqueueMetricsSave("svc1", "grp2", metrics);
    expect(listQueuedMetrics()).toHaveLength(2);
  });

  it("supprime après sync réussie", async () => {
    enqueueMetricsSave("svc1", "grp1", metrics);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true }),
    );
    const result = await flushMetricsQueue();
    expect(result.synced).toBe(1);
    expect(queuedMetricsCount()).toBe(0);
  });

  it("envoie toutes les classes d’un service en une requête", async () => {
    enqueueMetricsSave("svc1", "grp1", metrics);
    enqueueMetricsSave("svc1", "grp2", { ...metrics, presentCount: 10 });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const result = await flushMetricsQueue();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as { body: string }).body,
    ) as { groups: unknown[] };
    expect(body.groups).toHaveLength(2);
    expect(result.synced).toBe(2);
    expect(queuedMetricsCount()).toBe(0);
  });

  it("conserve la file si la sync échoue", async () => {
    enqueueMetricsSave("svc1", "grp1", metrics);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false }),
    );
    const result = await flushMetricsQueue();
    expect(result.failed).toBe(1);
    expect(queuedMetricsCount()).toBe(1);
    removeQueuedMetrics("svc1", "grp1");
    expect(queuedMetricsCount()).toBe(0);
  });
});
