import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;
const LIME = '#d1f18d';

function FeaturedStep({
  indexLabel,
  title,
  heading,
  imageSrc,
  imageAlt,
  children,
  kicker,
  stats,
  cta,
  titleColor,
}: {
  indexLabel: string;
  title: string;
  heading: string;
  imageSrc: string;
  imageAlt: string;
  children: ReactNode;
  kicker: string;
  stats: { value: string; label: string }[];
  cta: string;
  titleColor?: MotionValue<string>;
}) {
  return (
    <article className="relative mx-auto w-full max-w-[1100px] pb-7 text-left">
      <div className="grid overflow-hidden rounded-[22px] bg-white shadow-[0_22px_60px_rgba(0,0,0,0.38)] lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="relative min-h-[min(44vh,400px)] bg-[#ececec] lg:min-h-[min(50vh,440px)]">
          <div className="pointer-events-none absolute inset-x-4 top-3 z-10 flex items-end gap-2 sm:inset-x-6 sm:top-4">
            <span className="pb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {indexLabel}
            </span>
            <motion.h3
              style={titleColor ? { color: titleColor } : { color: '#111111' }}
              className="font-hero text-[clamp(2.15rem,6.2vw,4.35rem)] font-bold leading-[0.82] tracking-[-0.055em]"
            >
              {title}
            </motion.h3>
          </div>
          <img
            src={imageSrc}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full object-contain object-center p-6 pt-16 sm:p-8 sm:pt-[4.5rem]"
          />
        </div>

        <div className="flex flex-col px-6 py-7 text-zinc-900 sm:px-8 sm:py-8">
          <h4 className="text-[22px] font-extrabold tracking-tight text-zinc-900 sm:text-[26px]">
            {heading}
          </h4>
          {children}

          <div className="mt-auto border-t border-zinc-200 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              {kicker}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-[26px] font-extrabold leading-none tracking-tight sm:text-[30px]">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <a
        href="#contact"
        className="absolute left-1/2 top-full z-20 -translate-x-1/2 -translate-y-1/2 rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-black shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
        style={{ backgroundColor: LIME }}
      >
        {cta}
      </a>
    </article>
  );
}

function StepWindows({
  intro,
  children,
}: {
  intro: ReactNode;
  children: ReactNode[];
}) {
  const reduced = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  // 0 = Menu, 1 = Pesée, 2 = Pilotage.
  // Scroll : la carte part à gauche, la suivante arrive par la droite.
  const posRaw = useTransform(
    scrollYProgress,
    [0, 0.08, 0.36, 0.44, 0.72, 0.8, 1],
    [0, 0, 1, 1, 2, 2, 2],
  );
  const pos = useSpring(posRaw, {
    stiffness: 160,
    damping: 32,
    mass: 0.22,
  });

  const x0 = useTransform(pos, (p) => `translate3d(${(0 - p) * 100}vw, 0, 0)`);
  const x1 = useTransform(pos, (p) => `translate3d(${(1 - p) * 100}vw, 0, 0)`);
  const x2 = useTransform(pos, (p) => `translate3d(${(2 - p) * 100}vw, 0, 0)`);
  const panels = [x0, x1, x2];
  const title0 = useTransform(pos, (p) => {
    const fade = Math.min(1, Math.abs(p - 0) / 0.42);
    const c = Math.round(17 + 167 * fade);
    return `rgb(${c},${c},${c})`;
  });
  const title1 = useTransform(pos, (p) => {
    const fade = Math.min(1, Math.abs(p - 1) / 0.42);
    const c = Math.round(17 + 167 * fade);
    return `rgb(${c},${c},${c})`;
  });
  const title2 = useTransform(pos, (p) => {
    const fade = Math.min(1, Math.abs(p - 2) / 0.42);
    const c = Math.round(17 + 167 * fade);
    return `rgb(${c},${c},${c})`;
  });
  const titles = [title0, title1, title2];

  const items = Children.toArray(children);

  if (reduced) {
    return (
      <div className="px-4 pb-16 pt-[4.75rem]">
        {intro}
        <div className="mt-6 space-y-14">{items}</div>
      </div>
    );
  }

  return (
    <div ref={trackRef} className="relative h-[480vh]">
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="absolute inset-x-0 top-[4.75rem] z-10 px-4">{intro}</div>
        {items.map((child, i) => (
          <motion.div
            key={i}
            style={{ transform: panels[i], zIndex: i + 1 }}
            className="absolute inset-0 flex items-center justify-center px-4 pt-[7.5rem] pb-10 will-change-transform"
          >
            {isValidElement(child)
              ? cloneElement(
                  child as ReactElement<{ titleColor?: MotionValue<string> }>,
                  { titleColor: titles[i] },
                )
              : child}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    <FeaturedStep
      key="menu"
      indexLabel="01 —"
      title="Menu"
      heading="Préparer le menu du jour"
      imageSrc="/marketing/menu-rubriques.png"
      imageAlt="Menu cuisine : rubriques Entrées, Plats, Desserts, Autres et bouton Enregistrer le menu"
      kicker="Avant le service"
      cta="Voir le menu"
      stats={[
        { value: 'UE-14', label: 'Allergènes' },
        { value: 'g / assiette', label: 'Grammage' },
      ]}
    >
      <p className="mt-3.5 max-w-[42ch] text-[15px] font-medium leading-[1.75] text-zinc-800 sm:text-[16px] sm:leading-[1.8]">
        Avant le service, l’équipe renseigne chaque plat :{' '}
        <span className="font-extrabold text-zinc-950">intitulé</span>,{' '}
        <span className="font-extrabold text-zinc-950">grammage</span> et{' '}
        <span className="font-extrabold text-zinc-950">allergènes UE-14</span>.
        Cuisine et administration partagent la même information, clairement,
        pour servir juste et éviter les erreurs.
      </p>
      <p className="mt-3 max-w-[42ch] text-[15px] font-medium leading-[1.75] text-zinc-800 sm:text-[16px]">
        Ouvrez une rubrique, validez le plat, puis enregistrez le menu complet
        en un clic.
      </p>
    </FeaturedStep>,
    <FeaturedStep
      key="pesee"
      indexLabel="02 —"
      title="Pesée"
      heading="Servir, puis mesurer"
      imageSrc="/marketing/pesee-dechets.png?v=2"
      imageAlt="Pesée des déchets : poids total, maternelle et primaire"
      kicker="Fin de service"
      cta="Voir la pesée"
      stats={[
        { value: 'Mat. / Prim.', label: 'Deux niveaux' },
        { value: 'g et kg', label: 'Pesée' },
      ]}
    >
      <p className="mt-3.5 max-w-[42ch] text-[15px] font-medium leading-[1.75] text-zinc-800 sm:text-[16px] sm:leading-[1.8]">
        Après le repas, saisissez le poids des bacs en grammes, en distinguant{' '}
        <span className="font-extrabold text-zinc-950">maternelle</span> et{' '}
        <span className="font-extrabold text-zinc-950">primaire</span>.
        Le total se calcule tout de suite, aussi en kilos.
      </p>
      <p className="mt-3 max-w-[42ch] text-[15px] font-medium leading-[1.75] text-zinc-800 sm:text-[16px]">
        Une pesée par cycle, puis Enregistrer : les chiffres alimentent le
        suivi du gaspillage, sans tableur à part.
      </p>
    </FeaturedStep>,
    <FeaturedStep
      key="pilotage"
      indexLabel="03 —"
      title="Pilotage"
      heading="Comprendre avec Cantine+"
      imageSrc="/marketing/vue-cuisine.png"
      imageAlt="Tableau de bord cuisine : présents, assiettes servies, RAB, refus et déchets"
      kicker="7 ou 30 jours"
      cta="Voir le pilotage"
      stats={[
        { value: '7 / 30 j', label: 'Période' },
        { value: 'g / 100', label: 'Indicateur' },
      ]}
    >
      <p className="mt-3.5 max-w-[42ch] text-[15px] font-medium leading-[1.75] text-zinc-800 sm:text-[16px] sm:leading-[1.8]">
        Le tableau de bord rassemble présents, assiettes servies,{' '}
        <span className="font-extrabold text-zinc-950">RAB</span>,{' '}
        <span className="font-extrabold text-zinc-950">refus</span> et{' '}
        <span className="font-extrabold text-zinc-950">déchets</span>.
        Cuisine et administration voient les mêmes tendances, sur 7 ou 30
        jours.
      </p>
      <p className="mt-3 max-w-[42ch] text-[15px] font-medium leading-[1.75] text-zinc-800 sm:text-[16px]">
        De quoi préparer les ajustements et nourrir les échanges en
        commission, sans reconstruire les chiffres à la main.
      </p>
    </FeaturedStep>,
  ];

  const intro = (
    <motion.div
      className="mx-auto max-w-[640px] text-center"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.4, ease }}
    >
      <span className="eyebrow !text-[10px] !tracking-[0.16em] text-primary">
        Du menu au bilan
      </span>
      <h2
        id="how-title"
        className="mt-1 text-[clamp(1rem,2vw,1.25rem)] font-extrabold leading-[1.15] tracking-[-0.04em] text-white"
      >
        Un quotidien plus simple. Trois étapes, une même équipe.
      </h2>
      <p className="mx-auto mt-1 max-w-[480px] text-[11px] leading-snug text-zinc-500 sm:text-[12px]">
        Pas un outil de plus. Un lien entre celles et ceux qui préparent, servent
        et pilotent la restauration scolaire.
      </p>
    </motion.div>
  );

  return (
    <section
      className="relative z-10 rounded-t-[2.25rem] border-y border-white/10 bg-[#121212] text-white shadow-[0_-30px_80px_rgba(18,18,18,0.18)] sm:rounded-t-[3rem]"
      aria-labelledby="how-title"
    >
      <StepWindows intro={intro}>{steps}</StepWindows>
    </section>
  );
}
