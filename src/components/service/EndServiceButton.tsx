"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { rememberActiveServiceId } from "@/lib/activeService";
import { flushMetricsQueue } from "@/lib/offlineMetricsQueue";

type Props = {
  className?: string;
  compact?: boolean;
  capsule?: boolean;
  banner?: boolean;
};

export function EndServiceButton({
  className,
  compact = false,
  capsule = false,
  banner = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {banner ? (
        <div
          className={cn(
            "flex w-full flex-col gap-3 rounded-[28px] bg-[#0d3b2e] px-4 py-3.5 shadow-[0_12px_32px_rgba(13,59,46,0.28)] sm:flex-row sm:items-center sm:justify-between sm:px-5",
            className,
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3ddc84] text-[#0d3b2e]"
              aria-hidden
            >
              <Check className="h-5 w-5" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-base font-extrabold leading-tight text-white">
                Service terminé ?
              </p>
              <p className="mt-0.5 text-sm leading-snug text-white/80">
                Un clic clôture le service et revient au choix de la date.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-2xl bg-[#00c46a] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#00b05f] active:bg-[#009e55] sm:min-w-[11.5rem]"
          >
            Fin de service
          </button>
        </div>
      ) : capsule ? (
        <>
          <button
            type="button"
            className={cn(
              "group hidden items-stretch overflow-hidden rounded-full bg-red-600 hover:bg-red-700 sm:flex",
              className,
            )}
            onClick={() => setOpen(true)}
          >
            <span className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:px-5 sm:text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Fin de service
            </span>
            <span className="flex w-11 items-center justify-center bg-[#d1f18d] transition-transform group-hover:scale-105 sm:w-12">
              <ArrowRight size={18} strokeWidth={2.5} className="text-black" />
            </span>
          </button>
          <button
            type="button"
            aria-label="Fin de service"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 sm:hidden"
            onClick={() => setOpen(true)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d1f18d]">
              <CheckCircle2 className="h-4 w-4 text-black" />
            </span>
          </button>
        </>
      ) : (
        <Button
          type="button"
          size={compact ? "sm" : "default"}
          className={cn(
            "rounded-xl border border-red-700 bg-red-600 font-semibold text-white shadow-sm hover:bg-red-700 active:bg-red-800",
            compact && "gap-2",
            className,
          )}
          onClick={() => setOpen(true)}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className={cn(compact && "truncate text-xs sm:text-sm")}>
            Fin de service
          </span>
        </Button>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer le service ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous retournerez à l&apos;écran Service cantine pour choisir une autre date ou un
              autre repas. Les compteurs et le menu déjà saisis restent enregistrés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void (async () => {
                  try {
                    await flushMetricsQueue();
                  } finally {
                    setOpen(false);
                    rememberActiveServiceId(null);
                    router.push("/service");
                  }
                })();
              }}
            >
              Terminer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
