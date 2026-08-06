import { Cloud, Leaf, Sun } from "lucide-react";

const clouds = [
  { top: "8%", size: 90, duration: 48, delay: 0, opacity: 0.85 },
  { top: "18%", size: 60, duration: 66, delay: -12, opacity: 0.6 },
  { top: "30%", size: 120, duration: 80, delay: -30, opacity: 0.5 },
  { top: "5%", size: 48, duration: 58, delay: -44, opacity: 0.7 },
];

const leaves = [
  { left: "12%", top: "22%", size: 26, duration: 7, delay: 0 },
  { left: "82%", top: "14%", size: 20, duration: 9, delay: -2 },
  { left: "68%", top: "40%", size: 30, duration: 8, delay: -4 },
  { left: "30%", top: "52%", size: 18, duration: 6.5, delay: -1 },
  { left: "90%", top: "55%", size: 24, duration: 10, delay: -5 },
];

export function AnimatedBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-sky/45 via-background to-secondary" />

      <div className="c360-sun absolute -right-16 -top-16 text-sun/70">
        <Sun className="size-64" strokeWidth={1} />
      </div>

      {clouds.map((c, i) => (
        <div
          key={`cloud-${i}`}
          className="c360-cloud absolute text-sky-foreground/25"
          style={{
            top: c.top,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
            opacity: c.opacity,
          }}
        >
          <Cloud
            className="fill-current"
            style={{ width: c.size, height: c.size }}
            strokeWidth={1}
          />
        </div>
      ))}

      {leaves.map((l, i) => (
        <div
          key={`leaf-${i}`}
          className="c360-leaf absolute text-primary/25"
          style={{
            left: l.left,
            top: l.top,
            animationDuration: `${l.duration}s`,
            animationDelay: `${l.delay}s`,
          }}
        >
          <Leaf
            className="fill-current"
            style={{ width: l.size, height: l.size }}
            strokeWidth={1}
          />
        </div>
      ))}

      <svg
        className="absolute bottom-0 left-0 w-full text-primary/15"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        style={{ height: "30vh" }}
      >
        <path
          fill="currentColor"
          d="M0 120 C 220 40 420 200 720 130 C 1010 64 1180 200 1440 110 L 1440 220 L 0 220 Z"
        />
        <path
          className="text-primary/25"
          fill="currentColor"
          d="M0 170 C 260 120 480 220 760 170 C 1040 120 1220 210 1440 160 L 1440 220 L 0 220 Z"
        />
      </svg>
    </div>
  );
}
