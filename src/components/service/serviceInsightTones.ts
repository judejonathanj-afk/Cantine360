export type ServiceInsightTone = "emerald" | "amber" | "sky" | "violet" | "slate" | "black";

export const SERVICE_INSIGHT_TONES: Record<
  ServiceInsightTone,
  {
    shell: string;
    icon: string;
    text: string;
    title: string;
    muted: string;
    expand: string;
    expandBorder: string;
    hover: string;
    chevron: string;
    nested: string;
  }
> = {
  emerald: {
    shell: "border-emerald-700 bg-emerald-600",
    icon: "bg-white/20 text-white ring-1 ring-white/30",
    text: "text-white",
    title: "text-white",
    muted: "text-white/85",
    expand: "bg-emerald-700/50",
    expandBorder: "border-white/20",
    hover: "hover:bg-emerald-700/40",
    chevron: "text-white/80",
    nested: "bg-white/15 text-white ring-1 ring-white/20",
  },
  amber: {
    shell: "border-amber-600 bg-amber-500",
    icon: "bg-white/20 text-white ring-1 ring-white/30",
    text: "text-white",
    title: "text-white",
    muted: "text-white/85",
    expand: "bg-amber-600/50",
    expandBorder: "border-white/20",
    hover: "hover:bg-amber-600/40",
    chevron: "text-white/80",
    nested: "bg-white/15 text-white ring-1 ring-white/20",
  },
  sky: {
    shell: "border-sky-700 bg-sky-600",
    icon: "bg-white/20 text-white ring-1 ring-white/30",
    text: "text-white",
    title: "text-white",
    muted: "text-white/85",
    expand: "bg-sky-700/50",
    expandBorder: "border-white/20",
    hover: "hover:bg-sky-700/40",
    chevron: "text-white/80",
    nested: "bg-white/15 text-white ring-1 ring-white/20",
  },
  violet: {
    shell: "border-violet-700 bg-violet-600",
    icon: "bg-white/20 text-white ring-1 ring-white/30",
    text: "text-white",
    title: "text-white",
    muted: "text-white/85",
    expand: "bg-violet-700/50",
    expandBorder: "border-white/20",
    hover: "hover:bg-violet-700/40",
    chevron: "text-white/80",
    nested: "bg-white/15 text-white ring-1 ring-white/20",
  },
  slate: {
    shell: "border-zinc-900 bg-zinc-800",
    icon: "bg-white/20 text-white ring-1 ring-white/30",
    text: "text-white",
    title: "text-white",
    muted: "text-white/85",
    expand: "bg-zinc-900/50",
    expandBorder: "border-white/20",
    hover: "hover:bg-zinc-900/40",
    chevron: "text-white/80",
    nested: "bg-white/15 text-white ring-1 ring-white/20",
  },
  black: {
    shell: "border-[#1a2d4a] bg-[#0a1628]",
    icon: "bg-white/15 text-white ring-1 ring-white/25",
    text: "text-white",
    title: "text-yellow-300",
    muted: "text-white/80",
    expand: "bg-white/10",
    expandBorder: "border-white/15",
    hover: "hover:bg-white/5",
    chevron: "text-white/70",
    nested: "bg-white/10 text-white ring-1 ring-white/15",
  },
};
