export type QueuedWastePayload = {
  wasteWeightMaternelleG: number | null;
  wasteWeightPrimaireG: number | null;
};

export type QueuedWasteEntry = {
  serviceId: string;
  waste: QueuedWastePayload;
  updatedAt: number;
};

const STORAGE_KEY = "c360_waste_queue";

function readQueue(): QueuedWasteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedWasteEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(entries: QueuedWasteEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event("c360-offline-queue"));
}

export function getQueuedWaste(serviceId: string): QueuedWasteEntry | null {
  return readQueue().find((e) => e.serviceId === serviceId) ?? null;
}

export function enqueueWasteSave(
  serviceId: string,
  waste: QueuedWastePayload,
): QueuedWasteEntry {
  const entry: QueuedWasteEntry = {
    serviceId,
    waste,
    updatedAt: Date.now(),
  };
  const rest = readQueue().filter((e) => e.serviceId !== serviceId);
  writeQueue([...rest, entry]);
  return entry;
}

export function removeQueuedWaste(serviceId: string) {
  writeQueue(readQueue().filter((e) => e.serviceId !== serviceId));
}

export function listQueuedWaste(): QueuedWasteEntry[] {
  return readQueue().sort((a, b) => a.updatedAt - b.updatedAt);
}

export function queuedWasteCount(): number {
  return readQueue().length;
}

export async function flushWasteQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const entries = listQueuedWaste();
  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const res = await fetch(`/api/services/${entry.serviceId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          wasteWeightMaternelleG: entry.waste.wasteWeightMaternelleG,
          wasteWeightPrimaireG: entry.waste.wasteWeightPrimaireG,
        }),
      });
      if (!res.ok) {
        failed++;
        continue;
      }
      removeQueuedWaste(entry.serviceId);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
