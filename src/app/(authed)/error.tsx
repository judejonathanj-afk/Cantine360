"use client";

export default function AuthedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
        Cantine360
      </p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-950">
        Impossible de charger cette page
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        Un souci temporaire (réseau ou base) a interrompu le chargement. Réessayez
        — vos saisies déjà enregistrées ne sont pas perdues.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-2xl bg-[#00c46a] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#00b05f]"
      >
        Réessayer
      </button>
    </div>
  );
}
