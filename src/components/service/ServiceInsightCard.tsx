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
}: Props) {
  const t = SERVICE_INSIGHT_TONES[tone];

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border p-4 shadow-md",
        compact ? "min-h-[10.5rem]" : "min-h-0",
        t.shell,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            t.icon,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className={cn("min-w-0 flex-1", t.text)}>
          <h2 className="text-base font-semibold leading-snug">{title}</h2>
          {subtitle ? (
            <p className={cn("mt-1 text-sm leading-relaxed", t.muted)}>{subtitle}</p>
          ) : null}
        </div>
      </div>

      {metric ? (
        <div className={cn("mt-3 text-3xl font-bold tracking-tight", t.text)}>{metric}</div>
      ) : null}

      {children ? (
        <div className={cn("mt-3 flex-1 text-base leading-relaxed", t.muted)}>{children}</div>
      ) : null}
    </div>
  );
}
