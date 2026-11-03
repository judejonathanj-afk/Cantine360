import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Play, WifiOff, Scale, ChartNoAxesCombined, Leaf, Check, GraduationCap } from 'lucide-react';

const HERO_LIME = '#d2ff5a';
const HERO_TICKER_WORDS = ['Menu', 'Service', 'Antigaspi', 'Élèves', 'Bilans'] as const;

function HeroTicker() {
  const words = [...HERO_TICKER_WORDS, ...HERO_TICKER_WORDS, ...HERO_TICKER_WORDS, ...HERO_TICKER_WORDS];
  return (
    <div
      className="relative mt-12 w-full overflow-hidden"
      style={{ backgroundColor: HERO_LIME }}
      aria-hidden
    >
      <div className="hero-ticker-track flex w-max py-3 sm:py-3.5">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="px-8 text-[12px] font-extrabold uppercase tracking-[0.22em] text-zinc-950 sm:px-10 sm:text-[13px]"
          >
            {word}
          </span>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent sm:w-24"
        aria-hidden
      />
    </div>
  );
}

function HeroSlideButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex max-w-full items-stretch overflow-hidden rounded-full shadow-[0_10px_28px_rgba(25,54,45,0.14)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{ backgroundColor: HERO_LIME }}
    >
      <span className="flex min-h-[48px] items-center gap-2 py-2 pl-1 pr-3 text-[10px] font-bold uppercase tracking-[0.14em] text-black sm:min-h-[52px] sm:text-[11px] sm:tracking-[0.16em]">
        {children}
      </span>
      <span className="my-1.5 mr-1.5 flex items-center gap-1.5 rounded-full bg-black py-1 pl-1 pr-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
          style={{ backgroundColor: HERO_LIME }}
        >
          <ArrowRight size={17} strokeWidth={2.5} className="text-black" />
        </span>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: HERO_LIME }} />
      </span>
    </Link>
  );
}

const benefits = [
  { icon: WifiOff, title: 'Pensé pour le terrain', text: 'Le service, même hors ligne', color: 'bg-[var(--mint)] text-primary' },
  { icon: Scale, title: 'Chaque pesée compte', text: 'Maternelle / primaire · g / 100 assiettes', color: 'bg-[#fff5d9] text-[#947119]' },
  { icon: ChartNoAxesCombined, title: 'Une vision partagée', text: 'Dashboard cuisine & administration', color: 'bg-[var(--lavender)] text-[var(--violet)]' },
  { icon: Leaf, title: 'Antigaspillage à la carte', text: 'Un mode activé par l’administration', color: 'bg-[var(--sky)] text-[var(--blue)]' },
];

export function Hero() {
  return (
    <section id="accueil" className="hero-surface relative min-h-[100dvh] overflow-hidden pb-0 pt-4 sm:pt-6">
      <div
        aria-hidden
        className="pointer-events-none relative mb-1 select-none overflow-hidden px-4 sm:px-6 lg:px-8"
      >
        <p className="font-hero mx-auto max-w-[1180px] whitespace-nowrap text-[clamp(3.4rem,14vw,9.5rem)] font-bold leading-[0.85] tracking-[-0.04em]">
          <span style={{ color: '#b6dfc6' }}>Cant</span>
          <span style={{ color: '#d4c6ee' }}>in</span>
          <span style={{ color: '#eed98a' }}>e</span>
          <span style={{ color: '#8ec4e8' }}>3</span>
          <span style={{ color: '#b6dfc6' }}>6</span>
          <span style={{ color: '#d4c6ee' }}>0</span>
        </p>
      </div>
      <div className="rail relative max-w-[1180px] text-left">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d3e8dc] bg-[#eff8f2] px-3.5 py-1.5 text-[11px] font-semibold text-primary">
              <GraduationCap size={14} strokeWidth={1.8} /> Cantine scolaire{' '}
              <span className="mx-1 h-3 border-r border-[#c1ddcc]" />
              <span className="font-normal">Du terrain au pilotage</span>
            </div>
            <h1 className="font-hero mt-6 max-w-[18ch] text-[clamp(2.35rem,5.8vw,3.85rem)] font-bold leading-[1.08] tracking-[-0.02em] text-[var(--ink)] sm:max-w-none sm:text-[clamp(2.55rem,4.6vw,3.95rem)] lg:max-w-[16ch]">
              Moins de gaspillage.
              <br />
              <span className="text-primary">Un service mieux</span>
              <br />
              <span style={{ color: '#6d8f82' }}>piloté,</span>{' '}
              <span style={{ color: 'var(--violet)' }}>chaque jour.</span>
            </h1>
            <p className="mt-5 max-w-[34rem] text-[15px] font-normal leading-[1.65] text-muted-foreground sm:mt-6 sm:text-[17px] sm:leading-[1.7]">
              Cantine360 relie la cuisine et l’administration : saisie du déjeuner, pesées des
              déchets en maternelle et primaire, menus et allergènes, tableaux de bord sur 7 ou 30
              jours.
            </p>
            <div className="mt-8 flex w-full flex-wrap items-center gap-3 sm:mt-9 sm:gap-4">
              <HeroSlideButton to="/?demande=demo#contact">Demander une démo</HeroSlideButton>
              <HeroSlideButton to="/#fonctionnalites">
                <Play size={14} strokeWidth={2.5} className="shrink-0" />
                Voir les fonctionnalités
              </HeroSlideButton>
            </div>
            <div className="mt-4 flex w-full flex-wrap gap-x-5 gap-y-2 text-[10px] text-muted-foreground sm:text-[11px]">
              <span className="flex items-center gap-1.5">
                <Check size={12} className="text-primary" /> Une démo adaptée à votre établissement
              </span>
              <span className="flex items-center gap-1.5">
                <Check size={12} className="text-primary" /> Sans engagement
              </span>
            </div>
          </div>
          <figure className="relative">
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/20 via-[#cfe6ff]/50 to-[var(--lavender)] blur-xl"
            />
            <div className="overflow-hidden rounded-[1.75rem] border border-[#d7e7dc] bg-white shadow-[0_18px_40px_rgba(25,54,45,0.12)]">
              <img
                src="/marketing/cantine-hero.png"
                alt="Enfants de primaire déjeunant à la cantine scolaire"
                className="aspect-[4/3] h-full w-full object-cover object-center"
              />
            </div>
            <figcaption className="mt-3 text-center text-[13px] text-muted-foreground">
              La cantine primaire : produire juste, servir juste, jeter moins.
            </figcaption>
          </figure>
        </div>
        <div className="mx-auto mt-12 grid w-full max-w-[1240px] grid-cols-2 gap-x-5 gap-y-6 text-left lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text, color }) => <div className="flex items-start gap-3" key={title}><div className={`icon-tile !h-10 !w-10 ${color}`}><Icon size={19} strokeWidth={1.7} /></div><div className="pt-0.5"><h2 className="text-[12px] font-bold leading-5 sm:text-[13px]">{title}</h2><p className="mt-1 text-[10px] leading-[1.7] text-muted-foreground sm:text-[11px]">{text}</p></div></div>)}
        </div>
      </div>
      <HeroTicker />
    </section>
  );
}
