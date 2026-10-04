export type QueuedMetricsPayload = {
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
};

export type QueuedMetricsEntry = {
  key: string;
  serviceId: string;
  groupId: string;
  metrics: QueuedMetricsPayload;
  updatedAt: number;
};

const STORAGE_KEY = "c360_metrics_queue";

function queueKey(serviceId: string, groupId: string) {
  return `${serviceId}:${groupId}`;
}

function readQueue(): QueuedMetricsEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedMetricsEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(entries: QueuedMetricsEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("c360-offline-queue"));
}

export function getQueuedMetrics(
  serviceId: string,
  groupId: string,
): QueuedMetricsEntry | null {
  const key = queueKey(serviceId, groupId);
  return readQueue().find((e) => e.key === key) ?? null;
}

export function enqueueMetricsSave(
  serviceId: string,
  groupId: string,
  metrics: QueuedMetricsPayload,
): QueuedMetricsEntry {
  const key = queueKey(serviceId, groupId);
  const entry: QueuedMetricsEntry = {
    key,
    serviceId,
    groupId,
    metrics,
    updatedAt: Date.now(),
  };
  const rest = readQueue().filter((e) => e.key !== key);
  writeQueue([...rest, entry]);
  return entry;
}

export function removeQueuedMetrics(serviceId: string, groupId: string) {
  const key = queueKey(serviceId, groupId);
  writeQueue(readQueue().filter((e) => e.key !== key));
}

function removeQueuedKeys(keys: string[]) {
  const drop = new Set(keys);
  writeQueue(readQueue().filter((e) => !drop.has(e.key)));
}

export function listQueuedMetrics(): QueuedMetricsEntry[] {
  return readQueue().sort((a, b) => a.updatedAt - b.updatedAt);
}

export function queuedMetricsCount(): number {
  return readQueue().length;
}

let inflight: Promise<{ synced: number; failed: number }> | null = null;

async function flushNow(): Promise<{ synced: number; failed: number }> {
  const byService = new Map<string, QueuedMetricsEntry[]>();
  for (const entry of listQueuedMetrics()) {
    const group = byService.get(entry.serviceId) ?? [];
    group.push(entry);
    byService.set(entry.serviceId, group);
  }

  let synced = 0;
  let failed = 0;

  for (const [serviceId, group] of byService) {
    try {
      const res = await fetch(`/api/services/${serviceId}/metrics`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          groups: group.map((entry) => ({
            groupId: entry.groupId,
            ...entry.metrics,
          })),
        }),
      });
      if (!res.ok) {
        failed += group.length;
        continue;
      }
      removeQueuedKeys(group.map((entry) => entry.key));
      synced += group.length;
    } catch {
      failed += group.length;
    }
  }

  return { synced, failed };
}

/** Une requête par service, pour toutes les classes en attente. */
export function flushMetricsQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  if (inflight) return inflight;
  inflight = flushNow().finally(() => {
    inflight = null;
  });
  return inflight;
}
