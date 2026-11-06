"use client";

type FloatingCloseButtonProps = {
  onClick: () => void;
};

/** Bouton Fermer toujours visible en bas à droite pendant le scroll. */
export function FloatingCloseButton({ onClick }: FloatingCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-4 z-50 rounded-full bg-[#37784a] px-8 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(15,23,42,0.28)] transition hover:bg-[#2f6840] sm:bottom-6 sm:right-6 sm:text-base"
    >
      Fermer
    </button>
  );
}
