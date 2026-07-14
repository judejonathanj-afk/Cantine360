"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Info } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SERVICE_INSIGHT_TONES } from "@/components/service/serviceInsightTones";
import { cn } from "@/lib/utils";

const t = SERVICE_INSIGHT_TONES.black;

export function ServiceWorkflowHint({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const openFromSave = searchParams.get("liste") === "1";
  const [open, setOpen] = useState(openFromSave);

  useEffect(() => {
    if (openFromSave) setOpen(true);
  }, [openFromSave]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("group h-full", className)}>
      <div
        className={cn(
          "flex h-full min-h-[10.5rem] flex-col overflow-hidden rounded-2xl border shadow-md",
          t.shell,
        )}
      >
        <CollapsibleTrigger
          className={cn(
            "flex flex-1 flex-col px-4 py-4 text-left outline-none [&[data-state=open]]:flex-none",
            t.hover,
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                t.icon,
              )}
            >
              <Info className="h-5 w-5" aria-hidden />
            </span>
            <span className={cn("min-w-0 flex-1", t.text)}>
              <span className={cn("block text-base font-semibold", t.title)}>Aide — flux de saisie</span>
              <span className={cn("mt-1 block text-sm leading-relaxed", t.muted)}>
                Ordre conseillé pour les nouveaux — ouvrir pour voir les étapes.
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-200",
                t.chevron,
                open ? "rotate-180" : "",
              )}
              aria-hidden
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn("border-t px-4 pb-4 pt-3", t.expandBorder, t.expand, t.text)}
        >
          <ol className={cn("list-decimal space-y-2 pl-5 text-base leading-relaxed", t.muted)}>
            <li>
              <strong className={cn("font-semibold", t.text)}>Ce jour, ce déjeuner.</strong> Les
              chiffres concernent uniquement la date en titre.
            </li>
            <li>
              <strong className={cn("font-semibold", t.text)}>Menu & allergènes</strong> —
              renseignez le menu et le{" "}
              <strong className={cn("font-semibold", t.text)}>grammage (g / assiette)</strong> avant
              le service.
            </li>
            <li>
              <strong className={cn("font-semibold", t.text)}>Présents</strong> — saisie manuelle ou{" "}
              <strong className={cn("font-semibold", t.text)}>import CSV</strong> depuis cette page.
            </li>
            <li>
              <strong className={cn("font-semibold", t.text)}>Servis, RAB, refus, restes</strong> —
              en général après le repas.
            </li>
            <li>
              <strong className={cn("font-semibold", t.text)}>Poids des déchets</strong> —
              poids total après le service, en <strong className={cn("font-semibold", t.text)}>grammes</strong>.
            </li>
          </ol>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
