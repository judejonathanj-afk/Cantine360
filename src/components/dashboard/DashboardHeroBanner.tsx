import { Leaf, Sparkles } from "lucide-react";
import { DashboardProfileAvatar } from "@/components/dashboard/DashboardProfileAvatar";

export function DashboardHeroBanner({
  schoolNames,
  days,
  isKitchen,
  establishmentId,
}: {
  schoolNames: string[];
  days: 7 | 30;
  isKitchen: boolean;
  establishmentId: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[color:var(--dash-ink)] text-[color:var(--dash-ink-fg)] shadow-[0_24px_60px_-24px_oklch(0.3_0.045_178_/_0.55)] ring-1 ring-white/5">
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-[color:var(--dash-accent)]/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex flex-col gap-6 p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur">
            <Sparkles className="size-3.5 text-[color:var(--dash-accent)]" />
            {isKitchen
              ? "Tableau de bord cuisine"
              : "Tableau de bord anti-gaspillage"}
          </div>

          <div className="flex items-center gap-3">
            {isKitchen ? (
              <DashboardProfileAvatar establishmentId={establishmentId} />
            ) : null}
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl">
              {isKitchen
                ? "Pilotage cuisine"
                : "Bienvenue sur votre pilotage cantine"}
              {schoolNames.length === 1 ? (
                <span className="text-white/90"> — {schoolNames[0]}</span>
              ) : null}
            </h1>
          </div>

          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-[color:var(--dash-ink-muted)]">
            {isKitchen
              ? `Aperçu du jour et évolution des déchets sur les ${days} derniers jours.`
              : `Chiffres clés du déjeuner, note Cantine+, évolution des déchets et détail jour par jour — sur ${days} jours.`}
          </p>

          {schoolNames.length > 1 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-[color:var(--dash-ink-muted)]">
                Écoles suivies
              </span>
              {schoolNames.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10"
                >
                  <Leaf className="size-3 text-primary" />
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur lg:flex-col lg:items-center lg:text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
            <Leaf className="size-7 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display text-lg font-extrabold tracking-tight">
              Cantine<span className="text-[color:var(--dash-accent)]">+</span>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--dash-ink-muted)]">
              Stop au gaspillage
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
