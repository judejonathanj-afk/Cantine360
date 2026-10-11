import { ChefHat } from "lucide-react";

export function PlatformBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">
        <ChefHat size={compact ? 20 : 23} strokeWidth={2.4} aria-hidden />
      </span>
      {!compact && (
        <strong>
          Cantine<span>360</span>
        </strong>
      )}
    </div>
  );
}
