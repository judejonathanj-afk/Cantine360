import { Building2, ChefHat, Leaf } from "lucide-react";
import { DashboardProfileAvatar } from "@/components/dashboard/DashboardProfileAvatar";
import { cn } from "@/lib/utils";

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
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px]",
        isKitchen
          ? "bg-gradient-to-r from-[#ff9a32] via-[#ff7a22] to-[#f26522] text-white shadow-[0_18px_40px_-18px_rgba(242,101,34,0.55)]"
          : "bg-white text-zinc-900 shadow-[0_18px_40px_-18px_rgba(24,24,27,0.18)] ring-1 ring-zinc-200",
      )}
    >
      {isKitchen ? (
      <div className="pointer-events-none absolute -left-16 top-8 h-40 w-64 rounded-full bg-[#ffb15a]/35 blur-2xl" />
      ) : null}
      <svg
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full",
          isKitchen ? "text-[#c2410c]/25" : "hidden",
        )}
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
      {isKitchen ? (
        <img
          src="/dashboard/banner-cuisine-droite.jpg?v=5"
          alt=""
          className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden h-full w-auto max-w-[58%] object-cover object-right [mask-image:linear-gradient(to_right,transparent,black_18%)] sm:block"
        />
      ) : (
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
      )}
      {isKitchen ? (
        <Leaf className="pointer-events-none absolute left-8 top-16 size-5 rotate-12 text-white/20" aria-hidden />
      ) : null}

      <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7">
        <div className="min-w-0 max-w-xl lg:max-w-3xl">
          <div
            className={cn(
              "mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 backdrop-blur",
              isKitchen
                ? "bg-white/25 text-white ring-white/30"
                : "bg-zinc-100 text-zinc-700 ring-zinc-200",
            )}
          >
            <ChefHat className="size-3.5" aria-hidden />
            {isKitchen ? "Tableau de bord cuisine" : "Tableau de bord anti-gaspillage"}
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
                {isKitchen ? "Pilotage cuisine" : "Suivi anti-gaspi"}
              </h1>
              <p
                className={cn(
                  "mt-2 max-w-xl text-sm leading-relaxed sm:text-base",
                  isKitchen ? "text-white/90" : "text-zinc-600",
                )}
              >
                {isKitchen
                  ? `Aperçu du jour et évolution des déchets sur les ${days} derniers jours.`
                  : `Chiffres clés du déjeuner, note Cantine+ et évolution des déchets sur ${days} jours.`}
              </p>
            </div>
          </div>

          {schoolNames.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide",
                  isKitchen ? "text-white/90" : "text-zinc-500",
                )}
              >
                <Building2 className="size-3.5" aria-hidden />
                Écoles suivies
              </span>
              <span
                className={cn("mx-1 hidden h-4 w-px sm:inline-block", isKitchen ? "bg-white/50" : "bg-zinc-300")}
                aria-hidden
              />
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
