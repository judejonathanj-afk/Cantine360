"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { ServiceSaisieOverlay } from "@/components/service/ServiceSaisieOverlay";
import { cn } from "@/lib/utils";

const FOLD_STORAGE_KEY = "cantine360-dashboard-fold";

export function DashboardFoldOverlay({
  kicker,
  openLabel,
  overlayTitle,
  hint,
  subtitle,
  titleClassName,
  headerAction,
  dialogClassName,
  panelClassName,
  closeButtonClassName,
  icon: Icon,
  labelledBy,
  children,
}: {
  kicker: string;
  openLabel: string;
  overlayTitle: string;
  hint: string;
  subtitle?: string;
  titleClassName?: string;
  headerAction?: ReactNode;
  dialogClassName?: string;
  panelClassName?: string;
  closeButtonClassName?: string;
  icon: LucideIcon;
  labelledBy: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(FOLD_STORAGE_KEY) === labelledBy) {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [labelledBy]);

  function setFoldOpen(next: boolean) {
    setOpen(next);
    try {
      if (next) sessionStorage.setItem(FOLD_STORAGE_KEY, labelledBy);
      else if (sessionStorage.getItem(FOLD_STORAGE_KEY) === labelledBy) {
        sessionStorage.removeItem(FOLD_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div>
      <section className="overflow-hidden rounded-[28px] bg-[#0d3b2e] shadow-[0_12px_32px_rgba(13,59,46,0.28)] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100">
        <button
          type="button"
          onClick={() => setFoldOpen(true)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/5 sm:px-5 sm:py-4"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DFF59A] text-[#0d3b2e] sm:h-11 sm:w-11"
            aria-hidden
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              {kicker}
            </span>
            <span className="block text-base font-extrabold tracking-tight text-white sm:text-lg">
              {openLabel}
            </span>
            <span className="mt-0.5 block text-sm leading-snug text-white/80">
              {hint}
            </span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-white/70" aria-hidden />
        </button>
      </section>

      <ServiceSaisieOverlay
        open={open}
        onClose={() => setFoldOpen(false)}
        labelledBy={labelledBy}
        className={cn(
          "w-[calc(100vw-1rem)] max-w-[92rem]",
          dialogClassName,
        )}
      >
        <div className="mb-2 flex items-start justify-between gap-3 px-1 pt-4 sm:pt-5">
          <div className="min-w-0">
            <h2
              id={labelledBy}
              className={cn(
                "flex items-center gap-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl",
                titleClassName,
              )}
            >
              <Icon className="h-7 w-7 shrink-0" strokeWidth={2.25} aria-hidden />
              {overlayTitle}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">
                {subtitle}
              </p>
            ) : null}
            <p className="mt-1 text-sm font-medium leading-snug text-white/85 sm:text-base">
              {hint}
            </p>
          </div>
          {headerAction}
        </div>
        <div
          className={cn(
            "flex min-h-0 max-h-[94vh] flex-col gap-3 rounded-[24px] bg-white p-3 shadow-[0_24px_60px_rgba(24,24,27,0.28)] sm:p-4",
            panelClassName,
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
          <div className="flex shrink-0 justify-end">
            <button
              type="button"
              onClick={() => setFoldOpen(false)}
              className={cn(
                "rounded-2xl bg-[#00c46a] px-8 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#00b05f] active:scale-[0.98] motion-reduce:hover:scale-100",
                closeButtonClassName,
              )}
            >
              Fermer
            </button>
          </div>
        </div>
      </ServiceSaisieOverlay>
    </div>
  );
}
