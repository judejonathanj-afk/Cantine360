export type QueuedMetricsPayload = {
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
  leftoversCount: number;
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

export function listQueuedMetrics(): QueuedMetricsEntry[] {
  return readQueue().sort((a, b) => a.updatedAt - b.updatedAt);
}

export function queuedMetricsCount(): number {
  return readQueue().length;
}

export async function flushMetricsQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const entries = listQueuedMetrics();
  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const res = await fetch(`/api/services/${entry.serviceId}/metrics`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ groupId: entry.groupId, ...entry.metrics }),
      });
      if (!res.ok) {
        failed++;
        continue;
      }
      removeQueuedMetrics(entry.serviceId, entry.groupId);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
