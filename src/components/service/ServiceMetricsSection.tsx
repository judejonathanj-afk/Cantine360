"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ServiceAttendanceImport } from "@/components/service/ServiceAttendanceImport";
import {
  ServiceClassGrid,
  type ServiceClassCard,
} from "@/components/service/ServiceClassGrid";
import { ServiceSchoolFilter } from "@/components/service/ServiceSchoolFilter";
import { ServiceLevelFilter } from "@/components/service/ServiceLevelFilter";
import type { SchoolLevel } from "@/lib/schoolLevel";

export function ServiceMetricsSection({
  serviceId,
  kitchenMode,
  presentTotal,
  cards,
  hasMenu,
}: {
  serviceId: string;
  kitchenMode: boolean;
  presentTotal: number;
  cards: ServiceClassCard[];
  hasMenu: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollGroupId = searchParams.get("group");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<"all" | SchoolLevel>("all");
  const scrolledToGroup = useRef(false);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (schoolFilter !== "all" && c.schoolName !== schoolFilter) return false;
      if (levelFilter !== "all" && c.level !== levelFilter) return false;
      return true;
    });
  }, [cards, schoolFilter, levelFilter]);

  useEffect(() => {
    if (!scrollGroupId || scrolledToGroup.current) return;

    const card = cards.find((c) => c.groupId === scrollGroupId);
    if (!card) return;

    if (schoolFilter !== "all" && card.schoolName !== schoolFilter) {
      setSchoolFilter("all");
      return;
    }
    if (levelFilter !== "all" && card.level !== levelFilter) {
      setLevelFilter("all");
      return;
    }

    const el = document.getElementById(`group-${scrollGroupId}`);
    if (!el) return;

    scrolledToGroup.current = true;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const timeout = window.setTimeout(() => {
      router.replace(`/service/${serviceId}`, { scroll: false });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [cards, levelFilter, router, schoolFilter, scrollGroupId, serviceId]);

  return (
    <div className="space-y-4">
      <div
        className="border-t border-zinc-300 pt-6"
        role="separator"
        aria-hidden
      />
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          Saisie par classe
        </h2>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
          Appuyez sur une <strong className="font-semibold text-zinc-800">classe</strong> pour
          ouvrir le compteur, remplissez les chiffres (présents, servis, RAB, refus), puis{" "}
          <strong className="font-semibold text-zinc-800">Enregistrer</strong>. Les déchets se
          saisissent en grammes en fin de service.
        </p>
      </div>
      <ServiceAttendanceImport
        serviceId={serviceId}
        kitchenMode={kitchenMode}
        presentTotal={presentTotal}
        className="w-full"
      />
      <ServiceLevelFilter cards={cards} value={levelFilter} onChange={setLevelFilter} />
      <ServiceSchoolFilter
        cards={cards}
        value={schoolFilter}
        onChange={(school) => {
          setSchoolFilter(school);
          // « Toutes » = toutes les écoles et tous les niveaux
          if (school === "all") setLevelFilter("all");
        }}
      />
      <ServiceClassGrid serviceId={serviceId} cards={filtered} hasMenu={hasMenu} />
    </div>
  );
}
