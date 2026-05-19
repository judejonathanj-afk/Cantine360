"use client";

import { Fredoka } from "next/font/google";
import { groupCardColorForIndex } from "@/lib/groupCardColors";
import { cn } from "@/lib/utils";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600", "700"],
});

/** Style « MENUS CANTINE » : une couleur par lettre, police enfantine */
const DEFAULT_TEXT = "MENU CANTINE & ALLERGÈNES";

export function MenusCantineColorTitle({
  text = DEFAULT_TEXT,
  className,
}: {
  text?: string;
  className?: string;
}) {
  let colorIndex = 0;

  return (
    <h1
      className={cn(
        fredoka.className,
        "flex flex-wrap items-center justify-center gap-y-1 text-4xl font-bold uppercase leading-tight tracking-wide md:text-5xl lg:text-6xl",
        className,
      )}
      aria-label={text}
    >
      {[...text].map((char, i) => {
        if (char === " ") {
          return <span key={`sp-${i}`} className="w-2 sm:w-3" aria-hidden />;
        }
        if (char === "&") {
          return (
            <span
              key={`amp-${i}`}
              style={{ color: groupCardColorForIndex(colorIndex++) }}
              className="mx-0.5 inline-block"
            >
              &
            </span>
          );
        }
        const color = groupCardColorForIndex(colorIndex++);
        return (
          <span key={`${char}-${i}`} style={{ color }} className="inline-block">
            {char}
          </span>
        );
      })}
    </h1>
  );
}
