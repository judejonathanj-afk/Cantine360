"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Recycle } from "lucide-react";
import { EU14_ALLERGENS, allergenButtonLabel } from "@/lib/allergens";
import { resolveGrammageSuggestion } from "@/lib/antiWasteGrammageSuggestion";
import type { DishWasteHistory } from "@/lib/antiWasteGrammageSuggestion";

type Category = "STARTER" | "MAIN" | "DESSERT" | "OTHER";
type Item = {
  category: Category;
  label: string;
  allergens: string[];
  grammageG: number | null;
  containsPork: boolean;
  containsMeat: boolean;
};

const CATEGORY_LABEL: Record<Category, string> = {
  STARTER: "🥬 Entrées",
  MAIN: "🥘 Plats",
  DESSERT: "🧁 Desserts",
  OTHER: "Autres",
};

const CATEGORY_PLACEHOLDER: Record<Category, string> = {
  STARTER: "Ex: Salade de tomates",
  MAIN: "Ex: Lasagnes maison",
  DESSERT: "Ex: Yaourt nature",
  OTHER: "Ex: Pain",
};

function emptyItem(category: Category): Item {
  return {
    category,
    label: "",
    allergens: [],
    grammageG: null,
    containsPork: false,
    containsMeat: false,
  };
}

const DEFAULT_CATEGORIES: Category[] = ["STARTER", "MAIN", "DESSERT"];

/** Une fiche vierge par rubrique principale si le menu est neuf ou incomplet. */
function initializeMenuItems(initialItems: Item[]): Item[] {
  const withFlags = initialItems.map((item) => ({
    ...item,
    containsPork: Boolean(item.containsPork),
    containsMeat: Boolean(item.containsMeat) || Boolean(item.containsPork),
  }));
  if (withFlags.length === 0) {
    return DEFAULT_CATEGORIES.map((category) => emptyItem(category));
  }

  const items = [...withFlags];
  for (const category of DEFAULT_CATEGORIES) {
    if (!items.some((i) => i.category === category)) {
      items.push(emptyItem(category));
    }
  }
  return items;
}

export function MenuEditor({
  serviceId,
  initialItems,
  dishImpact = {},
  antiWasteModeEnabled = false,
  dishWasteHistoryByLabel = {},
  targetGPer100 = null,
}: {
  serviceId: string;
  initialItems: Item[];
  dishImpact?: Record<string, number>;
  antiWasteModeEnabled?: boolean;
  dishWasteHistoryByLabel?: Record<string, DishWasteHistory>;
  targetGPer100?: number | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(() => initializeMenuItems(initialItems));
  const [openCategories, setOpenCategories] = useState<Record<Category, boolean>>({
    STARTER: false,
    MAIN: false,
    DESSERT: false,
    OTHER: false,
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function toggleCategory(cat: Category) {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function closeCategory(cat: Category) {
    setOpenCategories((prev) => ({ ...prev, [cat]: false }));
  }

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

  function categorySummary(cat: Category) {
    const labels = grouped[cat].map((i) => i.label.trim()).filter(Boolean);
    if (labels.length === 0) return "À compléter — appuyez pour ouvrir";
    if (labels.length === 1) return labels[0]!;
    return `${labels[0]!} · +${labels.length - 1} autre${labels.length > 2 ? "s" : ""}`;
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const cleaned = items
        .map((i) => ({
          ...i,
          label: i.label.trim(),
          allergens: i.allergens.filter(Boolean),
          grammageG: i.grammageG,
        }))
        .filter((i) => i.label.length > 0);

      const payload = JSON.stringify({ items: cleaned });
      const send = () =>
        fetch(`/api/services/${serviceId}/menu`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: payload,
        });
      let res = await send();
      if (!res.ok && res.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        res = await send();
      }
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
    setOpenCategories((prev) => ({ ...prev, [category]: true }));
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
      <p className="service-on-dark mx-auto max-w-4xl px-2 text-center text-base leading-relaxed text-zinc-600 md:text-lg">
        Renseignez <strong className="font-medium text-zinc-900">🥬 entrées</strong>,{" "}
        <strong className="font-medium text-zinc-900">🥘 plats</strong>,{" "}
        <strong className="font-medium text-zinc-900">🧁 desserts</strong> et{" "}
        <strong className="font-medium text-zinc-900">autres</strong> : intitulé, allergènes,{" "}
        <strong className="font-medium text-zinc-900">porc / viande</strong> et{" "}
        <strong className="font-medium text-zinc-900">grammage (g/assiette)</strong>.{" "}
        <strong className="font-medium text-zinc-900">Ouvrez chaque rubrique</strong> pour saisir,
        puis <strong className="font-medium text-zinc-900">enregistrez en bas</strong> quand c&apos;est
        prêt.
        {antiWasteModeEnabled ? (
          <>
            {" "}
            Antigaspillage : cliquez sur la suggestion à droite pour reprendre un grammage
            habituel.
          </>
        ) : null}
      </p>

      <div className="mx-auto max-w-4xl space-y-4 px-1 sm:px-2">
      {(Object.keys(CATEGORY_LABEL) as Category[]).map((cat) => {
        const isOpen = openCategories[cat];
        return (
        <section
          key={cat}
          className="service-surface-light relative overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_14px_40px_rgba(24,24,27,0.08)] transition-[transform,box-shadow] duration-200 ease-out hover:z-10 hover:scale-[1.025] hover:shadow-[0_22px_52px_rgba(24,24,27,0.14)] motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
          <div className="flex items-stretch gap-2 border-b border-zinc-100 bg-white sm:gap-3">
            <button
              type="button"
              onClick={() => toggleCategory(cat)}
              aria-expanded={isOpen}
              className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left transition hover:bg-zinc-50/80 sm:px-5"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d2ff5a] text-lg sm:h-10 sm:w-10`}
                aria-hidden
              >
                {CATEGORY_LABEL[cat].split(" ")[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Rubrique
                </span>
                <span className="block text-base font-extrabold tracking-tight text-zinc-900 sm:text-lg">
                  {CATEGORY_LABEL[cat].replace(/^[^\s]+\s/, "")}
                </span>
                {!isOpen ? (
                  <span className="mt-0.5 block truncate text-sm text-zinc-500">
                    {categorySummary(cat)}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            <div className="flex shrink-0 items-center border-l border-zinc-100 px-3 sm:px-4">
              <button
                type="button"
                onClick={() => add(cat)}
                className="rounded-xl border border-emerald-700 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 sm:text-sm"
              >
                Ajouter
              </button>
            </div>
          </div>

          {isOpen ? (
          <div className="space-y-3 bg-zinc-100/80 p-3 sm:p-4">
          {grouped[cat].length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
              Aucun élément — utilisez « Ajouter ».
            </div>
          ) : null}

          <div className="grid gap-3">
            {items.map((it, idx) => {
              if (it.category !== cat) return null;
              const suggestion = antiWasteModeEnabled
                ? resolveGrammageSuggestion({
                    category: it.category,
                    label: it.label,
                    historyByLabel: dishWasteHistoryByLabel,
                    targetGPer100,
                  })
                : null;
              return (
                <div
                  key={`${cat}-${idx}`}
                  className="rounded-2xl border-[2.5px] border-zinc-900 bg-zinc-700 p-4 shadow-sm"
                >
                  <div className="mb-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="rounded-lg border border-zinc-500 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-900"
                    >
                      Supprimer
                      {it.label.trim() ? ` « ${it.label.trim()} »` : ""}
                    </button>
                  </div>
                  <label className="block">
                    <span className="text-lg font-bold text-white">
                      Intitulé
                    </span>
                    <input
                      value={it.label}
                      onChange={(e) => update(idx, { label: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900"
                      placeholder={CATEGORY_PLACEHOLDER[cat]}
                    />
                  </label>

                  <div className="mt-4">
                    <span className="text-lg font-bold text-white">
                      Grammage (g / assiette)
                    </span>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                      <input
                        type="number"
                        min={1}
                        max={5000}
                        value={it.grammageG ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          update(idx, {
                            grammageG: raw === "" ? null : Number(raw),
                          });
                        }}
                        className="w-full max-w-xs rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 outline-none focus:border-zinc-900"
                        placeholder="Ex: 120"
                      />
                      {suggestion ? (
                        <button
                          type="button"
                          onClick={() =>
                            update(idx, { grammageG: suggestion.grams })
                          }
                          className="flex min-w-[11rem] flex-col justify-center rounded-xl border border-zinc-500 bg-zinc-800/90 px-3 py-2 text-left transition hover:border-zinc-400 hover:bg-zinc-800"
                        >
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-green-500">
                            <Recycle className="h-3.5 w-3.5 text-green-500" aria-hidden />
                            Antigaspillage propose
                          </span>
                          <span className="mt-0.5 text-xl font-bold tabular-nums text-white">
                            {suggestion.grams}{" "}
                            <span className="text-sm font-semibold text-zinc-200">g</span>
                          </span>
                          <span className="text-[11px] leading-snug text-zinc-300">
                            {suggestion.sourceLabel} — cliquer pour appliquer
                          </span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-lg font-bold text-white">Allergènes</div>
                    {it.label.trim() && dishImpact[`${it.category}:${it.label.trim()}`] ? (
                      <p className="mt-1 text-sm font-bold text-emerald-400">
                        {dishImpact[`${it.category}:${it.label.trim()}`]} élève
                        {dishImpact[`${it.category}:${it.label.trim()}`]! > 1 ? "s" : ""}{" "}
                        concerné
                        {dishImpact[`${it.category}:${it.label.trim()}`]! > 1 ? "s" : ""} (liste
                        importée)
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {EU14_ALLERGENS.map((a) => {
                        const selected = it.allergens.includes(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            title={a}
                            onClick={() => {
                              update(idx, {
                                allergens: selected
                                  ? it.allergens.filter((x) => x !== a)
                                  : [...it.allergens, a],
                              });
                            }}
                            className={[
                              "rounded-full border-2 border-zinc-900 px-4 py-2 text-sm font-bold shadow-sm",
                              selected
                                ? "bg-zinc-900 text-white"
                                : "bg-white text-zinc-900 hover:bg-zinc-100",
                            ].join(" ")}
                          >
                            {allergenButtonLabel(a)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-lg font-bold text-white">
                      Régimes (hors allergènes)
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const next = !it.containsPork;
                          update(idx, {
                            containsPork: next,
                            containsMeat: next ? true : it.containsMeat,
                          });
                        }}
                        className={[
                          "rounded-full border-2 border-zinc-900 px-4 py-2 text-sm font-bold shadow-sm",
                          it.containsPork
                            ? "bg-sky-800 text-white"
                            : "bg-white text-zinc-900 hover:bg-zinc-100",
                        ].join(" ")}
                      >
                        Contient du porc
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          update(idx, {
                            containsMeat: !it.containsMeat,
                            containsPork: !it.containsMeat
                              ? it.containsPork
                              : false,
                          })
                        }
                        className={[
                          "rounded-full border-2 border-zinc-900 px-4 py-2 text-sm font-bold shadow-sm",
                          it.containsMeat
                            ? "bg-emerald-800 text-white"
                            : "bg-white text-zinc-900 hover:bg-zinc-100",
                        ].join(" ")}
                      >
                        Contient de la viande
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end border-t border-zinc-600/80 pt-4">
                    <button
                      type="button"
                      onClick={() => closeCategory(cat)}
                      className="rounded-xl border border-emerald-700 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-emerald-700 active:bg-emerald-800"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
          ) : null}
        </section>
      );
      })}
      </div>

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
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

