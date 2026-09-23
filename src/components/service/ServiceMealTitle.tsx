import { cn } from "@/lib/utils";
import { ChildDrawnSun } from "@/components/service/ChildDrawnSun";
import { mealTypeLabelFr } from "@/lib/mealType";

export function mealTypeLabel(mealType: string) {
  return mealTypeLabelFr(mealType);
}

type Props = {
  mealType: string;
  dateLabel: string;
  className?: string;
  size?: "lg" | "sm";
};

export function ServiceMealTitle({
  mealType,
  dateLabel,
  className,
  size = "lg",
}: Props) {
  const meal = mealTypeLabel(mealType);

  const sunClass = size === "lg" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-7 w-7";

  const textClass =
    size === "lg"
      ? "min-w-0 max-w-full text-xl font-bold leading-tight tracking-tight text-balance sm:text-2xl"
      : "min-w-0 max-w-full text-sm font-medium md:text-base";

  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 flex-wrap items-center gap-2.5 text-zinc-900",
        className,
      )}
    >
      <span className={cn(textClass, "inline-flex flex-wrap items-center gap-x-2.5 gap-y-1")}>
        <span className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap">
          <ChildDrawnSun className={cn("shrink-0", sunClass)} aria-hidden />
          {meal}
        </span>
        <span aria-hidden className="shrink-0">
          —
        </span>
        <span className="min-w-0">{dateLabel}</span>
      </span>
    </span>
  );
}
