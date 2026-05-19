"use client";

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
};

export function Counter({ label, value, onChange, min = 0, max = 500 }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="text-sm font-medium text-zinc-700">{label}</div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={dec}
          className="h-12 w-12 rounded-2xl border border-zinc-300 text-xl font-semibold hover:bg-zinc-50"
          aria-label={`${label} -1`}
        >
          −
        </button>

        <input
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d]/g, ""));
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
            else onChange(min);
          }}
          inputMode="numeric"
          className="w-24 rounded-xl border border-zinc-300 px-3 py-3 text-center text-xl font-semibold outline-none focus:border-zinc-900"
        />

        <button
          type="button"
          onClick={inc}
          className="h-12 w-12 rounded-2xl bg-zinc-900 text-xl font-semibold text-white hover:bg-zinc-800"
          aria-label={`${label} +1`}
        >
          +
        </button>
      </div>
    </div>
  );
}

