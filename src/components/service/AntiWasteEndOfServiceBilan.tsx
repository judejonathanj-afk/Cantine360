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
      className="mx-auto w-full max-w-xl rounded-2xl border-2 border-emerald-600/35 bg-white px-4 py-4 text-left shadow-md ring-1 ring-emerald-100 sm:px-5 sm:py-5"
      role="status"
    >
      <div className="flex items-center gap-2.5 border-b border-emerald-200 pb-2.5">
        <Recycle className="h-5 w-5 text-emerald-800" aria-hidden />
        <p className="text-base font-extrabold text-emerald-950 sm:text-lg">
          Bilan Antigaspillage — pour demain
        </p>
      </div>
      <ol className="mt-3 list-decimal space-y-3 pl-5 text-[15px] font-semibold leading-relaxed text-zinc-900 marker:font-bold marker:text-emerald-800 sm:text-base">
        {tips.map((tip, i) => (
          <li
            key={i}
            className={cn(
              "pl-1",
              tip.tone === "watch" && "text-amber-950",
              tip.tone === "ok" && "text-emerald-950",
              tip.tone !== "watch" && tip.tone !== "ok" && "text-zinc-900",
            )}
          >
            {tip.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
