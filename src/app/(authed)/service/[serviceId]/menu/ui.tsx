"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EU14_ALLERGENS } from "@/lib/allergens";

type Category = "STARTER" | "MAIN" | "DESSERT" | "OTHER";
type Item = { category: Category; label: string; allergens: string[] };

const CATEGORY_LABEL: Record<Category, string> = {
  STARTER: "🥬 Entrées",
  MAIN: "🥘 Plats",
  DESSERT: "🧁 Desserts",
  OTHER: "Autres",
};

function emptyItem(category: Category): Item {
  return { category, label: "", allergens: [] };
}

export function MenuEditor({
  serviceId,
  initialItems,
}: {
  serviceId: string;
  initialItems: Item[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(
    initialItems.length > 0 ? initialItems : [emptyItem("MAIN")],
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const out: Record<Category, Item[]> = {
      STARTER: [],
      MAIN: [],
      DESSERT: [],
      OTHER: [],
    };
    for (const i of items) out[i.category].push(i);
    return out;
  }, [items]);

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const cleaned = items
        .map((i) => ({
          ...i,
          label: i.label.trim(),
          allergens: i.allergens.filter(Boolean),
        }))
        .filter((i) => i.label.length > 0);

      const res = await fetch(`/api/services/${serviceId}/menu`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: cleaned }),
      });
      if (!res.ok) {
        setStatus("Erreur de sauvegarde.");
        window.setTimeout(() => setStatus(null), 4000);
        return;
      }
      setStatus("Sauvegardé. Retour à la fiche service…");
      window.setTimeout(() => {
        router.push(`/service/${serviceId}`);
      }, 600);
    } finally {
      setBusy(false);
    }
  }

  function add(category: Category) {
    setItems((all) => [...all, emptyItem(category)]);
  }

  function remove(idx: number) {
    setItems((all) => all.filter((_, i) => i !== idx));
  }

  function update(idx: number, next: Partial<Item>) {
    setItems((all) => all.map((it, i) => (i === idx ? { ...it, ...next } : it)));
  }

  return (
    <div className="space-y-4">
      <p className="mx-auto max-w-3xl text-center text-base leading-relaxed text-zinc-600 md:text-lg">
        Renseignez les <strong className="font-medium text-zinc-900">🥬 entrées</strong>,{" "}
        <strong className="font-medium text-zinc-900">🥘 plats</strong>,{" "}
        <strong className="font-medium text-zinc-900">🧁 desserts</strong> et la rubrique{" "}
        <strong className="font-medium text-zinc-900">autres</strong> si besoin, puis les
        allergènes. <strong className="font-medium text-zinc-900">Enregistrez tout en bas</strong>{" "}
        une fois le menu complet.
      </p>

      {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => (
        <section key={cat} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {CATEGORY_LABEL[cat]}
            </h2>
            <button
              type="button"
              onClick={() => add(cat)}
              className="rounded-xl border border-emerald-700 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800"
            >
              Ajouter
            </button>
          </div>

          {grouped[cat].length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              Aucun élément.
            </div>
          ) : null}

          <div className="grid gap-3">
            {items.map((it, idx) => {
              if (it.category !== cat) return null;
              return (
                <div
                  key={`${cat}-${idx}`}
                  className="rounded-2xl border-[2.5px] border-zinc-900 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <label className="block flex-1">
                      <span className="text-sm font-medium text-zinc-900">
                        Intitulé
                      </span>
                      <input
                        value={it.label}
                        onChange={(e) => update(idx, { label: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-900"
                        placeholder="Ex: Lasagnes maison"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                    >
                      Supprimer
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium text-zinc-900">
                      Allergènes
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {EU14_ALLERGENS.map((a) => {
                        const selected = it.allergens.includes(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() => {
                              update(idx, {
                                allergens: selected
                                  ? it.allergens.filter((x) => x !== a)
                                  : [...it.allergens, a],
                              });
                            }}
                            className={[
                              "rounded-full px-3 py-1 text-xs font-semibold",
                              selected
                                ? "bg-zinc-900 text-white"
                                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200",
                            ].join(" ")}
                          >
                            {a}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
        <p className="max-w-xl text-sm text-emerald-950">
          {status ??
            "Quand tout est saisi, un seul clic enregistre tout le menu (toutes les rubriques)."}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="shrink-0 rounded-xl border border-emerald-700 bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 sm:min-w-[11rem]"
        >
          {busy ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

