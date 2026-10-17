import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SERVICE_INSIGHT_TONES,
  type ServiceInsightTone,
} from "@/components/service/serviceInsightTones";

export type { ServiceInsightTone };

type Props = {
  tone: ServiceInsightTone;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  metric?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
  /** Bandeau cuisine : peu haut, texte réduit */
  dense?: boolean;
  /** Contenu dans une carte groupée (sans bordure propre). */
  embedded?: boolean;
  centeredHeader?: boolean;
};

export function ServiceInsightCard({
  tone,
  icon: Icon,
  title,
  subtitle,
  metric,
  children,
  className,
  compact = false,
  dense = false,
  embedded = false,
  centeredHeader = false,
}: Props) {
  const t = SERVICE_INSIGHT_TONES[tone];
  const isDense = dense || (compact && tone === "soft");

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        embedded
          ? "min-h-0 border-0 bg-transparent p-0 shadow-none"
          : cn(
              "border",
              isDense
                ? "min-h-0 rounded-xl p-3 shadow-sm"
                : cn(
                    "rounded-2xl p-4 shadow-md",
                    compact ? "min-h-[10.5rem]" : "min-h-0",
                    centeredHeader && "p-5 sm:p-6",
                  ),
              t.shell,
            ),
        className,
      )}
    >
      {centeredHeader ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                t.icon,
              )}
            >
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h2 className={cn("text-lg font-semibold leading-snug sm:text-xl", t.title)}>
              {title}
            </h2>
          </div>
          {subtitle ? (
            <p className={cn("max-w-xl text-sm leading-relaxed sm:text-base", t.muted)}>
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : (
        <div className={cn("flex items-start gap-2.5", isDense && "items-center")}>
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg",
              isDense ? "h-8 w-8" : "h-10 w-10 rounded-xl",
              t.icon,
            )}
          >
            <Icon className={cn(isDense ? "h-4 w-4" : "h-5 w-5")} aria-hidden />
          </span>
          <div className={cn("min-w-0 flex-1", t.text)}>
            <h2
              className={cn(
                "font-bold leading-snug",
                isDense ? "text-sm" : "text-base",
                t.title,
              )}
            >
              {title}
            </h2>
            {subtitle ? (
              <p
                className={cn(
                  "leading-snug",
                  isDense ? "mt-0.5 text-xs" : "mt-1 text-sm leading-relaxed",
                  t.muted,
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {metric ? (
        <div
          className={cn(
            "font-bold tracking-tight",
            isDense ? "mt-1.5 text-lg font-extrabold" : "mt-3 text-3xl",
            centeredHeader && "text-center",
            t.text,
          )}
        >
          {metric}
        </div>
      ) : null}

      {children ? (
        <div
          className={cn(
            "flex-1 leading-snug",
            isDense ? "mt-1.5 text-xs" : "mt-3 text-base leading-relaxed",
            centeredHeader && "text-center",
            t.muted,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
