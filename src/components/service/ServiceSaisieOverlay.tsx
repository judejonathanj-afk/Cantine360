"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function ServiceSaisieOverlay({
  open,
  onClose,
  labelledBy,
  className,
  fillViewport = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  /** Feuille collée aux bords, jusqu’en bas de l’écran. */
  fillViewport?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (
        document.querySelector(
          '[data-slot="dialog-content"], [data-slot="alert-dialog-content"]',
        )
      ) {
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[80] flex justify-center",
        fillViewport
          ? "items-stretch p-0"
          : "items-center p-3 sm:p-5",
      )}
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-zinc-950/55 backdrop-blur-xl"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden overscroll-contain",
          fillViewport
            ? "absolute inset-0 h-auto min-h-0"
            : "max-h-full",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
