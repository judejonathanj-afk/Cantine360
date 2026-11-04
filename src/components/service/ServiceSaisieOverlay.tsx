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
          : "items-center overflow-y-auto p-4 pt-[5.75rem] sm:p-6 sm:pt-[6.5rem]",
      )}
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-zinc-900/30 backdrop-blur-2xl"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        style={
          fillViewport
            ? undefined
            : {
                width: "70vw",
                height: "70vh",
                maxWidth: "70vw",
                maxHeight: "70vh",
                flexShrink: 0,
              }
        }
        className={cn(
          "relative z-10 flex flex-col overflow-hidden overscroll-contain",
          fillViewport ? "absolute inset-0 h-auto min-h-0 w-full" : "shrink-0",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
