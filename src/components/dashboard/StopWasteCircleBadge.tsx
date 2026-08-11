import { cn } from "@/lib/utils";

/** Rond rouge « Stop au gaspillage alimentaire » — cercle + texte (avec morsure). */
export function StopWasteCircleBadge({
  className,
  title = "Stop au gaspillage alimentaire",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      <title>{title}</title>
      <defs>
        <mask id="stop-waste-bite">
          <rect width="120" height="120" fill="#fff" />
          {/* Morsure à droite */}
          <circle cx="118" cy="48" r="11" fill="#000" />
          <circle cx="120" cy="66" r="12" fill="#000" />
          <circle cx="116" cy="84" r="10" fill="#000" />
        </mask>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="#e53935"
        mask="url(#stop-waste-bite)"
      />
      <g
        fill="#ffffff"
        textAnchor="middle"
        fontFamily="Arial Narrow, Arial Black, Helvetica, sans-serif"
        fontWeight="800"
        transform="rotate(-18 60 62)"
      >
        <text x="60" y="52" fontSize="26" letterSpacing="1">
          STOP
        </text>
        <text x="60" y="70" fontSize="9.5" letterSpacing="0.3">
          AU GASPILLAGE
        </text>
        <text x="60" y="84" fontSize="9.5" letterSpacing="0.3">
          ALIMENTAIRE
        </text>
      </g>
    </svg>
  );
}
