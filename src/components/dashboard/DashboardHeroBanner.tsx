import { Building2, ChefHat, Leaf } from "lucide-react";
import { DashboardProfileAvatar } from "@/components/dashboard/DashboardProfileAvatar";

export function DashboardHeroBanner({
  schoolNames,
  days,
  isKitchen,
  establishmentId,
  establishmentLabel = "",
}: {
  schoolNames: string[];
  days: 7 | 30;
  isKitchen: boolean;
  establishmentId: string;
  establishmentLabel?: string;
}) {
  const adminWelcomeTitle = establishmentLabel
    ? `Bienvenue, espace admin — ${establishmentLabel}`
    : "Bienvenue sur votre espace admin";

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-white text-zinc-900 shadow-[0_18px_40px_-18px_rgba(24,24,27,0.18)] ring-1 ring-zinc-200">
      <svg
        className="pointer-events-none absolute inset-y-0 right-0 z-0 h-full w-[min(48%,32rem)]"
        viewBox="0 0 480 240"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="#86efac"
          d="M170 0C100 42 210 72 130 118C55 158 200 182 120 222C90 238 150 240 110 240H480V0H170Z"
        />
        <path
          fill="#16a34a"
          d="M250 0C175 48 290 78 200 128C125 170 275 196 190 228C165 240 210 240 180 240H480V0H250Z"
        />
      </svg>

      <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7">
        <div className="min-w-0 max-w-xl lg:max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-yellow-500 ring-1 ring-zinc-200 backdrop-blur">
            <ChefHat className="size-3.5 text-green-600" aria-hidden />
            {isKitchen ? "Tableau de bord cuisine" : "Tableau de bord Cantine360"}
          </div>

          <div className="flex items-center gap-4">
            {isKitchen ? (
              <DashboardProfileAvatar establishmentId={establishmentId} variant="banner" />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-zinc-200 bg-white text-emerald-600 shadow-sm">
                <Building2 className="size-8" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
                {isKitchen ? "Vue cuisine" : adminWelcomeTitle}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
                {isKitchen
                  ? `Aperçu du jour et évolution des déchets sur les ${days} derniers jours.`
                  : `Chiffres clés du déjeuner, note Cantine+ et évolution des déchets sur ${days} jours.`}
              </p>
            </div>
          </div>

          {schoolNames.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                <Building2 className="size-3.5" aria-hidden />
                Écoles suivies
              </span>
              <span className="mx-1 hidden h-4 w-px bg-zinc-300 sm:inline-block" aria-hidden />
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
      </div>
    </section>
  );
}
