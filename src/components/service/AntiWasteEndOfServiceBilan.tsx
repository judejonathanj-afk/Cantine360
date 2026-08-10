"use client";

import { Recycle } from "lucide-react";
import type { EndOfServiceBilanTip } from "@/lib/antiWasteEndOfServiceBilan";
import { cn } from "@/lib/utils";

export function AntiWasteEndOfServiceBilan({
  tips,
}: {
  tips: EndOfServiceBilanTip[];
}) {
  if (tips.length === 0) return null;

  return (
    <div
      className="w-full max-w-xl rounded-2xl border border-emerald-300 bg-emerald-50/90 px-4 py-3 text-left shadow-sm"
      role="status"
    >
      <div className="flex items-center gap-2">
        <Recycle className="h-4 w-4 text-emerald-700" aria-hidden />
        <p className="text-sm font-bold text-emerald-950">
          Bilan Antigaspillage — pour demain
        </p>
      </div>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-snug text-emerald-950/90">
        {tips.map((tip, i) => (
          <li
            key={i}
            className={cn(
              tip.tone === "watch" && "font-medium text-amber-950",
              tip.tone === "ok" && "text-emerald-900",
            )}
          >
            {tip.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
