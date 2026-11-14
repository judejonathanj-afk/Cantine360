import { ChevronRight, Recycle, Scale, Target, type LucideIcon } from "lucide-react";
import "./NosEngagementsCard.css";

const ITEMS: { icon: LucideIcon; label: string }[] = [
  { icon: Recycle, label: "Réduire le gaspillage" },
  { icon: Scale, label: "Adapter les portions" },
  { icon: Target, label: "Mesurer pour progresser" },
];

function LeafMark({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 80"
      fill="none"
      aria-hidden
    >
      <path
        d="M32 4C18 22 10 40 14 62c8-6 16-8 18-24 2 16 10 18 18 24 4-22-4-40-18-58Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M32 18v46"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

function BranchMark({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 220 90" fill="none" aria-hidden>
      <path
        d="M8 78C46 70 58 40 92 36c18-2 22 14 40 12 22-2 28-22 52-28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M92 36c-6 10-4 22 6 30"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M70 8c22 18 18 34 8 46C66 42 62 26 70 8Z"
        fill="currentColor"
      />
      <path
        d="M128 8c20 14 16 30 6 42-16-12-18-28-6-42Z"
        fill="currentColor"
      />
      <path
        d="M176 12c18 12 14 26 4 38-14-10-16-24-4-38Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NosEngagementsCard() {
  return (
    <article className="nos-engagements" aria-labelledby="nos-engagements-title">
      <LeafMark className="nos-engagements__leaf nos-engagements__leaf--top" />
      <BranchMark className="nos-engagements__leaf nos-engagements__leaf--bottom" />

      <div className="nos-engagements__content">
        <h2 id="nos-engagements-title" className="nos-engagements__title">
          Nos engagements
        </h2>
        <p className="nos-engagements__lead">
          Moins de gaspillage alimentaire, plus de plaisir dans l&apos;assiette !
        </p>
        <ul className="nos-engagements__list">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <div className="nos-engagements__item">
                  <span className="nos-engagements__icon">
                    <Icon className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="nos-engagements__item-label">{item.label}</span>
                  <ChevronRight
                    className="nos-engagements__chevron size-4"
                    aria-hidden
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="nos-engagements__visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/nos-engagements.png"
          alt="Restes alimentaires versés dans une poubelle de cantine"
        />
      </div>
    </article>
  );
}
