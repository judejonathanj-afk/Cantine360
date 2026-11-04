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
  bodyClassName,
  closeButtonClassName,
  foldTone = "forest",
  icon: Icon,
  iconTileClassName,
  labelledBy,
  tight = false,
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
  bodyClassName?: string;
  closeButtonClassName?: string;
  foldTone?: "forest" | "yellow" | "violet" | "rose";
  icon: LucideIcon;
  iconTileClassName?: string;
  labelledBy: string;
  tight?: boolean;
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

  const yellowFold = foldTone === "yellow";
  const violetFold = foldTone === "violet";
  const roseFold = foldTone === "rose";

  return (
    <div>
      <section
        className={cn(
          "overflow-hidden rounded-[28px] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100",
          yellowFold
            ? "bg-[#fbe961] shadow-[0_12px_32px_rgba(234,179,8,0.38)]"
            : violetFold
              ? "bg-[#5b21b6] shadow-[0_12px_32px_rgba(91,33,182,0.38)]"
              : roseFold
                ? "bg-rose-700 shadow-[0_12px_32px_rgba(190,18,60,0.38)]"
                : "bg-[#0d3b2e] shadow-[0_12px_32px_rgba(13,59,46,0.28)]",
        )}
      >
        <button
          type="button"
          onClick={() => setFoldOpen(true)}
          aria-expanded={open}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-3.5 text-left transition sm:px-5 sm:py-4",
            yellowFold ? "hover:bg-black/[0.04]" : "hover:bg-white/5",
          )}
        >
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-[20px] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] sm:size-[3.75rem]"
            aria-hidden
          >
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-[14px] sm:size-12 sm:rounded-2xl",
                iconTileClassName
                  ? iconTileClassName
                  : yellowFold
                    ? "bg-amber-200 text-amber-950"
                    : violetFold
                      ? "bg-violet-200 text-[#5b21b6]"
                      : roseFold
                        ? "bg-[#f6c9d6] text-[#7a2d45]"
                        : "bg-[#d8f48a] text-[#0d3b2e]",
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block text-[10px] font-bold uppercase tracking-[0.14em]",
                yellowFold ? "text-zinc-800/55" : "text-white/50",
              )}
            >
              {kicker}
            </span>
            <span
              className={cn(
                "block text-base font-extrabold tracking-tight sm:text-lg",
                yellowFold ? "text-zinc-950" : "text-white",
              )}
            >
              {openLabel}
            </span>
            <span
              className={cn(
                "mt-0.5 block text-sm leading-snug",
                yellowFold ? "text-zinc-800" : "text-white/80",
              )}
            >
              {hint}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0",
              yellowFold ? "text-zinc-700" : "text-white/70",
            )}
            aria-hidden
          />
        </button>
      </section>

      <ServiceSaisieOverlay
        open={open}
        onClose={() => setFoldOpen(false)}
        labelledBy={labelledBy}
        className={cn(
          "rounded-2xl bg-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]",
          dialogClassName,
        )}
        chrome={
          <div className="flex flex-col gap-2">
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
            {headerAction ? (
              <div className="flex w-full flex-wrap items-center justify-end gap-2">
                {headerAction}
              </div>
            ) : null}
          </div>
        }
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setFoldOpen(false)}
              className={cn(
                "shrink-0 rounded-2xl bg-[#00c46a] px-8 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#00b05f] active:scale-[0.98] motion-reduce:hover:scale-100",
                closeButtonClassName,
              )}
            >
              Fermer
            </button>
          </div>
        }
      >
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:bg-zinc-100/60",
            bodyClassName,
          )}
        >
          <div
            className={cn(
              tight
                ? "flex min-h-full flex-col p-1.5 pb-4 sm:p-2 sm:pb-5"
                : "flex min-h-full flex-col p-2 pb-4 sm:p-3 sm:pb-5",
              panelClassName,
            )}
          >
            {children}
          </div>
        </div>
      </ServiceSaisieOverlay>
    </div>
  );
}
