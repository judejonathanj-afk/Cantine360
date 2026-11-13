import { Building2, ChefHat, LayoutDashboard, Leaf } from "lucide-react";

export function DashboardHeroBanner({
  schoolNames,
  days,
  isKitchen,
  establishmentLabel = "",
}: {
  schoolNames: string[];
  days: 7 | 30;
  isKitchen: boolean;
  establishmentId: string;
  establishmentLabel?: string;
}) {
  const title = isKitchen
    ? "Vue cuisine"
    : establishmentLabel
      ? `Bienvenue, espace admin — ${establishmentLabel}`
      : "Bienvenue sur votre espace admin";
  const kicker = isKitchen ? "Tableau de bord cuisine" : "Tableau de bord admin";

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-white text-zinc-900 shadow-[0_18px_40px_-18px_rgba(24,24,27,0.16)] ring-1 ring-white">
      <div className="grid min-h-[11.5rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(14rem,0.85fr)]">
        <div className="relative z-10 px-6 py-5 sm:px-7 sm:py-6">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            <LayoutDashboard className="size-3.5" aria-hidden />
            {kicker}
          </p>

          <div className="flex items-center gap-4">
            <span
              className="flex size-[4.25rem] shrink-0 items-center justify-center rounded-full border-[3px] border-[#f3d7a0] bg-white text-emerald-700 shadow-sm"
              aria-hidden
            >
              {isKitchen ? (
                <ChefHat className="size-8" />
              ) : (
                <Building2 className="size-8" />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-extrabold leading-none tracking-tight text-zinc-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
                {isKitchen
                  ? `Aperçu du jour et évolution des déchets sur les ${days} derniers jours.`
                  : `Chiffres clés du déjeuner, note Cantine+ et évolution des déchets sur ${days} jours.`}
              </p>
            </div>
          </div>

          {schoolNames.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                <Building2 className="size-3.5" aria-hidden />
                Écoles suivies
              </span>
              <span className="mx-1 hidden h-4 w-px bg-zinc-200 sm:inline-block" aria-hidden />
              {schoolNames.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#fff6ea] px-3 py-1.5 text-sm font-bold tracking-tight text-[#7a3a0c]"
                >
                  <Leaf className="size-3.5 text-emerald-600" aria-hidden />
                  {s.startsWith("École") ? s : `École ${s}`}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative hidden min-h-[11.5rem] lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dashboard/banner-cuisine-droite.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/20" />
          <p className="absolute bottom-4 right-5 max-w-[11rem] text-right text-sm font-bold leading-snug text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]">
            Moins de gaspillage, plus d&apos;avenir.
          </p>
        </div>
      </div>
    </section>
  );
}
