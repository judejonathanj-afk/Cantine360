"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  adjacentNavHref,
  type SwipeNavItem,
} from "@/lib/adjacentNavHref";

const MIN_DX = 72;
const EDGE = 24;

function ignoreSwipeFrom(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='dialog'], [role='slider'], [data-no-nav-swipe]",
    ),
  );
}

function modalOpen() {
  return Boolean(
    document.querySelector(
      '[role="dialog"][aria-modal="true"], [data-slot="dialog-content"]',
    ),
  );
}

/** Glisser gauche / droite pour changer de page dans le menu. */
export function useNavSwipe(items: SwipeNavItem[], pathname: string) {
  const router = useRouter();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onStart(event: TouchEvent) {
      if (event.touches.length !== 1) return;
      if (modalOpen() || ignoreSwipeFrom(event.target)) return;
      const x = event.touches[0].clientX;
      if (x < EDGE || x > window.innerWidth - EDGE) return;
      tracking = true;
      startX = x;
      startY = event.touches[0].clientY;
    }

    function onEnd(event: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      if (modalOpen()) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < MIN_DX) return;
      if (Math.abs(dy) > Math.abs(dx) * 0.55) return;
      const direction: -1 | 1 = dx < 0 ? 1 : -1;
      const href = adjacentNavHref(itemsRef.current, pathname, direction);
      if (!href) return;
      router.push(href);
    }

    function onCancel() {
      tracking = false;
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onCancel);
    };
  }, [pathname, router]);
}
