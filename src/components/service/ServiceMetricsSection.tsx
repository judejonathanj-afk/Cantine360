"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueuedMetrics } from "@/hooks/useQueuedMetrics";
import { overlayQueuedCounts } from "@/lib/mergeQueuedMetrics";
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
  showCsvImport = false,
  cards,
  hasMenu,
}: {
  serviceId: string;
  showCsvImport?: boolean;
  cards: ServiceClassCard[];
  hasMenu: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollGroupId = searchParams.get("group");
  const queued = useQueuedMetrics(serviceId);
  const liveCards = useMemo(
    () => overlayQueuedCounts(cards, queued),
    [cards, queued],
  );
  const livePresent = liveCards.reduce((sum, card) => sum + card.presentCount, 0);
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<"all" | SchoolLevel>("all");
  const scrolledToGroup = useRef(false);

  const filtered = useMemo(() => {
    return liveCards.filter((c) => {
      if (schoolFilter !== "all" && c.schoolName !== schoolFilter) return false;
      if (levelFilter !== "all" && c.level !== levelFilter) return false;
      return true;
    });
  }, [liveCards, schoolFilter, levelFilter]);

  useEffect(() => {
    if (!scrollGroupId || scrolledToGroup.current) return;

    const card = liveCards.find((c) => c.groupId === scrollGroupId);
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
  }, [liveCards, levelFilter, router, schoolFilter, scrollGroupId, serviceId]);

  return (
    <div className="space-y-4">
      {showCsvImport ? (
        <>
          <ServiceAttendanceImport
            serviceId={serviceId}
            showCsvImport
            presentTotal={livePresent}
            className="w-full"
          />
          <ServiceLevelFilter cards={liveCards} value={levelFilter} onChange={setLevelFilter} />
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ServiceAttendanceImport
            serviceId={serviceId}
            presentTotal={livePresent}
          />
          <ServiceLevelFilter cards={liveCards} value={levelFilter} onChange={setLevelFilter} />
        </div>
      )}
      <ServiceSchoolFilter
        cards={liveCards}
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
