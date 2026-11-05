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
  fullPage = false,
  chrome,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  className?: string;
  /** Feuille collée aux bords, jusqu’en bas de l’écran. */
  fillViewport?: boolean;
  /** Fenêtre presque pleine page (titre au-dessus, fermer en bas). */
  fullPage?: boolean;
  /** Titre, textes et boutons au-dessus de la fenêtre. */
  chrome?: ReactNode;
  /** Bouton fermer sous la fenêtre. */
  footer?: ReactNode;
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
        "fixed inset-0 z-[80] flex justify-center overflow-hidden",
        fillViewport ? "items-stretch p-0" : "items-stretch",
      )}
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-zinc-900/30 backdrop-blur-2xl"
        onClick={onClose}
      />
      {fillViewport ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          className={cn(
            "relative z-10 flex h-auto min-h-0 w-full flex-col overflow-hidden overscroll-contain absolute inset-0",
            className,
          )}
        >
          {children}
        </div>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          className={cn(
            "relative z-10 flex h-full min-h-0 flex-col pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:pb-4 sm:pt-4",
            fullPage
              ? "w-[calc(100vw-1.25rem)] max-w-none sm:w-[calc(100vw-2rem)]"
              : "w-[88vw] max-w-[88vw]",
          )}
        >
          {chrome ? <div className="mb-2 shrink-0">{chrome}</div> : null}
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain",
              className,
            )}
          >
            {children}
          </div>
          {footer ? <div className="mt-3 shrink-0">{footer}</div> : null}
        </div>
      )}
    </div>,
    document.body,
  );
}
