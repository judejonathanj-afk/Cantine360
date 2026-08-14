import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardSectionHeading({
  icon: Icon,
  title,
  hint,
  trailing,
  lineClassName,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  trailing?: ReactNode;
  lineClassName?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-4" />
        </div>
        <h2 className="shrink-0 font-display text-xl font-bold tracking-tight text-black sm:text-2xl">
          {title}
        </h2>
        <div
          aria-hidden
          className={cn("dashboard-section-line", lineClassName)}
        />
        {trailing}
      </div>
      {hint ? (
        <p className="mt-1 pl-12 text-sm font-semibold text-black sm:pl-[3.25rem]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function DashboardLevelPill({ level }: { level: string }) {
  const isMaternelle = level.toLowerCase() === "maternelle";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-2 ring-black",
        isMaternelle
          ? "bg-sky-500/15 text-sky-900"
          : "bg-primary/15 text-emerald-900",
      )}
    >
      {level}
    </span>
  );
}

export function DashboardInsightCard({
  icon: Icon,
  title,
  level,
  description,
  children,
  headerClassName,
}: {
  icon: LucideIcon;
  title: string;
  level?: string;
  description: ReactNode;
  children: ReactNode;
  headerClassName?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div
        className={cn(
          "flex flex-col gap-3 border-b border-border/70 bg-secondary/40 p-5 sm:flex-row sm:items-start sm:gap-4",
          headerClassName,
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-black">
              {title}
            </h3>
            {level ? <DashboardLevelPill level={level} /> : null}
          </div>
          <div className="mt-1 text-sm font-semibold leading-relaxed text-black">
            {description}
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
