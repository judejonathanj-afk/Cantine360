import { describe, expect, it } from "vitest";
import {
  MAX_EXPORT_RANGE_DAYS,
  resolveExportDateRange,
} from "@/lib/exportDateRange";

describe("resolveExportDateRange", () => {
  it("accepte une plage courte", () => {
    const r = resolveExportDateRange("2026-07-01", "2026-07-20");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dayCount).toBe(20);
  });

  it("refuse une plage > max", () => {
    const r = resolveExportDateRange("2020-01-01", "2026-07-20");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(String(MAX_EXPORT_RANGE_DAYS));
  });

  it("refuse from > to", () => {
    const r = resolveExportDateRange("2026-07-20", "2026-07-01");
    expect(r.ok).toBe(false);
  });
});
