import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function mealTypeLabel(mealType: string) {
  return mealType === "DINNER" ? "Dîner" : "Déjeuner";
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
  const isDinner = mealType === "DINNER";
  const Icon = isDinner ? Moon : Sun;
  const meal = mealTypeLabel(mealType);

  const iconBox =
    size === "lg"
      ? "h-11 w-11 rounded-2xl [&_svg]:h-6 [&_svg]:w-6"
      : "h-8 w-8 rounded-xl [&_svg]:h-4 [&_svg]:w-4";

  const iconColors = isDinner
    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
    : "border-amber-200 bg-amber-50 text-amber-600";

  const textClass =
    size === "lg"
      ? "text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
      : "text-sm font-medium md:text-base";

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-2.5 text-zinc-900",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center border shadow-sm",
          iconBox,
          iconColors,
        )}
        aria-hidden
      >
        <Icon />
      </span>
      <span className={textClass}>
        {meal} — {dateLabel}
      </span>
    </span>
  );
}
