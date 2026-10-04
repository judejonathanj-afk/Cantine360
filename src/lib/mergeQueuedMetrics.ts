export type CountMetrics = {
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
};

export type QueuedCount = {
  groupId: string;
  metrics: CountMetrics;
};

/** Remplace les compteurs déjà saisis sur l’appareil, en attendant l’envoi groupé. */
export function overlayQueuedCounts<T extends CountMetrics & { groupId: string }>(
  rows: T[],
  queued: QueuedCount[],
): T[] {
  if (queued.length === 0) return rows;
  const byId = new Map(queued.map((q) => [q.groupId, q.metrics]));
  return rows.map((row) => {
    const next = byId.get(row.groupId);
    if (!next) return row;
    return {
      ...row,
      presentCount: next.presentCount,
      servedCount: next.servedCount,
      rabCount: next.rabCount,
      refusedCount: next.refusedCount,
    };
  });
}
