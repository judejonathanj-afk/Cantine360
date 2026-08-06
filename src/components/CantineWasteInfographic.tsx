import Image from "next/image";

/** Fiche « Le gaspillage à la cantine » — stats de sensibilisation. */
export function CantineWasteInfographic({ className }: { className?: string }) {
  return (
    <div
      className={[
        "w-full overflow-hidden rounded-2xl bg-[#b39dce] text-[#1a1228] shadow-xl shadow-primary/10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="px-5 py-8 sm:px-8 sm:py-10">
        <h2 className="text-balance text-center text-2xl font-extrabold leading-tight text-white sm:text-4xl">
          Le gaspillage à la cantine
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-pretty text-center text-sm font-medium leading-relaxed sm:mt-5 sm:text-base">
          Chaque jour, la restauration scolaire sert des millions de repas. Mais
          une part importante finit à la poubelle :{" "}
          <span className="font-extrabold text-white">
            près de 120 g de nourriture gaspillés par élève et par repas
          </span>{" "}
          — entrées à peine touchées, pain, restes de plat.
        </p>

        <div className="my-8 h-px w-full bg-[#1a1228]/70" />

        <div className="grid grid-cols-1 gap-y-10 md:grid-cols-2 md:gap-x-6">
          <div className="flex flex-col items-center">
            <p className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
              Un élève jette
            </p>

            <div className="mt-3 flex w-full items-center justify-center gap-3 sm:gap-6">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black leading-none sm:text-7xl">
                  30
                  <span className="text-3xl sm:text-5xl">kg</span>
                </span>
                <span className="mt-2 max-w-[9rem] text-center text-base font-bold leading-tight text-white sm:text-lg">
                  de nourriture par an
                </span>
              </div>

              <div className="relative flex flex-col items-center">
                <span className="mb-1 text-base font-bold italic">dont</span>
                <Image
                  src="/images/poubelle-ouverte.png"
                  alt="Illustration d'une poubelle ouverte"
                  width={180}
                  height={200}
                  className="h-28 w-auto sm:h-36"
                />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center">
                  <span className="text-3xl font-black leading-none text-white sm:text-4xl">
                    120
                    <span className="text-xl sm:text-2xl">g</span>
                  </span>
                  <span className="text-center text-xs font-bold leading-tight text-white sm:text-sm">
                    jetés à
                    <br />
                    chaque repas
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 h-px w-4/5 bg-[#1a1228]/70 md:hidden" />
          </div>

          <div className="flex flex-col items-center">
            <p className="text-center text-xl font-extrabold leading-tight text-white sm:text-2xl">
              Le coût de ce gaspillage
              <br />
              atteint
            </p>

            <div className="relative mt-3 flex items-center justify-center">
              <Image
                src="/images/benne-noire.png"
                alt="Illustration d'une benne à ordures noire"
                width={360}
                height={320}
                className="h-40 w-auto sm:h-48"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-4">
                <span className="text-4xl font-black leading-none text-[#b39dce] sm:text-5xl">
                  200€
                </span>
                <span className="mt-1 text-center text-base font-extrabold leading-tight text-[#b39dce] sm:text-lg">
                  par élève
                  <br />
                  par an
                </span>
              </div>
            </div>

            <p className="mt-3 max-w-sm text-pretty text-center text-xs font-bold leading-snug sm:text-sm">
              Soit des millions d&apos;euros de repas jetés chaque année en
              France, alors que ces aliments étaient parfaitement consommables.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-[#1a1228]/70 pt-6">
          <p className="text-center text-base font-extrabold text-white sm:text-xl">
            Comment agir à la cantine ?
          </p>
          <div className="mx-auto mt-4 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              "Se servir de plus petites portions et se resservir si besoin",
              "Peser les déchets pour sensibiliser toute l'école",
              "Donner les invendus à des associations ou au compost",
            ].map((tip) => (
              <div
                key={tip}
                className="rounded-xl bg-[#1a1228]/15 p-3 text-center text-xs font-semibold leading-snug sm:text-sm"
              >
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
