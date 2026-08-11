import { cn } from "@/lib/utils";

/** Pomme « Stop au gaspillage alimentaire » — marque visuelle antigaspillage. */
export function StopWasteApple({
  className,
  title = "Stop au gaspillage alimentaire",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 220"
      role="img"
      aria-label={title}
      className={cn("shrink-0 drop-shadow-sm", className)}
    >
      <title>{title}</title>
      {/* Feuille verte */}
      <ellipse
        cx="78"
        cy="38"
        rx="22"
        ry="14"
        fill="#43a047"
        transform="rotate(-40 78 38)"
      />
      {/* Tige */}
      <path
        d="M98 48 C102 28, 118 22, 128 20"
        fill="none"
        stroke="#c62828"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Pomme — bas en forme de cœur (échancrure centrale) */}
      <path
        fill="#e53935"
        d="M100 52
           C72 52, 48 72, 42 102
           C34 140, 46 172, 72 196
           C84 206, 94 208, 100 200
           C106 208, 116 206, 128 196
           C154 172, 166 140, 158 102
           C152 72, 128 52, 100 52 Z"
      />
      {/* Texte blanc légèrement incliné */}
      <g
        fill="#ffffff"
        textAnchor="middle"
        fontFamily="Arial Narrow, Arial Black, Helvetica, sans-serif"
        fontWeight="800"
        transform="rotate(-5 100 128)"
      >
        <text x="100" y="116" fontSize="36" letterSpacing="1.5">
          STOP
        </text>
        <text x="100" y="138" fontSize="13" letterSpacing="0.4">
          AU GASPILLAGE
        </text>
        <text x="100" y="156" fontSize="13" letterSpacing="0.4">
          ALIMENTAIRE
        </text>
      </g>
    </svg>
  );
}
