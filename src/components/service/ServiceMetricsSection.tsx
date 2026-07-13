"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ServiceAttendanceImport } from "@/components/service/ServiceAttendanceImport";
import {
  ServiceClassGrid,
  type ServiceClassCard,
} from "@/components/service/ServiceClassGrid";
import { ServiceSchoolFilter } from "@/components/service/ServiceSchoolFilter";

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
  const scrolledToGroup = useRef(false);

  const filtered = useMemo(
    () =>
      schoolFilter === "all"
        ? cards
        : cards.filter((c) => c.schoolName === schoolFilter),
    [cards, schoolFilter],
  );

  useEffect(() => {
    if (!scrollGroupId || scrolledToGroup.current) return;

    const card = cards.find((c) => c.groupId === scrollGroupId);
    if (!card) return;

    if (schoolFilter !== "all" && card.schoolName !== schoolFilter) {
      setSchoolFilter("all");
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
  }, [cards, router, schoolFilter, scrollGroupId, serviceId]);

  return (
    <div className="space-y-4">
      <ServiceAttendanceImport
        serviceId={serviceId}
        kitchenMode={kitchenMode}
        presentTotal={presentTotal}
        className="w-full"
      />
      <ServiceSchoolFilter cards={cards} value={schoolFilter} onChange={setSchoolFilter} />
      <ServiceClassGrid serviceId={serviceId} cards={filtered} hasMenu={hasMenu} />
    </div>
  );
}
