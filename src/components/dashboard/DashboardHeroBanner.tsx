import { Building2, ChefHat, Leaf } from "lucide-react";
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
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#ff9a32] via-[#ff7a22] to-[#f26522] text-white shadow-[0_18px_40px_-18px_rgba(242,101,34,0.55)]">
      <div className="pointer-events-none absolute -left-16 top-8 h-40 w-64 rounded-full bg-[#ffb15a]/35 blur-2xl" />
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-[#c2410c]/25"
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0 90c80 40 160-20 260 0s180 50 280 10 180-60 280-20 200 40 260 10 80-30 120-10v80H0Z"
        />
        <path
          fill="currentColor"
          opacity="0.7"
          d="M0 120c120 20 180-30 300-10s200 40 320 8 180-36 280-8 160 20 300 0v50H0Z"
        />
      </svg>
      <img
        src="/dashboard/banner-cuisine-droite.jpg?v=5"
        alt=""
        className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden h-full w-auto max-w-[58%] object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_18%)] sm:block"
      />
      <Leaf className="pointer-events-none absolute left-8 top-16 size-5 rotate-12 text-white/20" aria-hidden />

      <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7">
        <div className="min-w-0 max-w-xl lg:max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/25 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/30 backdrop-blur">
            <ChefHat className="size-3.5" aria-hidden />
            {isKitchen ? "Tableau de bord cuisine" : "Tableau de bord anti-gaspillage"}
          </div>

          <div className="flex items-center gap-4">
            {isKitchen ? (
              <DashboardProfileAvatar establishmentId={establishmentId} variant="banner" />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-orange-200 bg-white text-emerald-600 shadow-sm">
                <ChefHat className="size-8" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
                {isKitchen ? "Pilotage cuisine" : "Pilotage cantine"}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                {isKitchen
                  ? `Aperçu du jour et évolution des déchets sur les ${days} derniers jours.`
                  : `Chiffres clés du déjeuner, note Cantine+ et évolution des déchets sur ${days} jours.`}
              </p>
            </div>
          </div>

          {schoolNames.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                <Building2 className="size-3.5" aria-hidden />
                Écoles suivies
              </span>
              <span className="mx-1 hidden h-4 w-px bg-white/50 sm:inline-block" aria-hidden />
              {schoolNames.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#fff6ea] px-3 py-1 text-xs font-semibold text-[#9a4b12] shadow-sm"
                >
                  <Leaf className="size-3.5 text-emerald-600" aria-hidden />
                  {s}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="absolute left-1/2 top-5 z-20 flex w-fit -translate-x-1/2 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-[#145c32] shadow-lg shadow-orange-900/10 sm:top-6 max-lg:relative max-lg:left-auto max-lg:top-auto max-lg:mx-auto max-lg:mt-6 max-lg:translate-none">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f26522] text-white">
            <Leaf className="size-6" aria-hidden />
          </span>
          <div>
            <div className="font-display text-xl font-extrabold leading-none tracking-tight">
              Cantine<span className="text-[#f26522]">+</span>
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f26522]">
              Stop au gaspillage
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
