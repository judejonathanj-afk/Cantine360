"use client";

import { useMemo, useState } from "react";
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
  const [schoolFilter, setSchoolFilter] = useState("all");

  const filtered = useMemo(
    () =>
      schoolFilter === "all"
        ? cards
        : cards.filter((c) => c.schoolName === schoolFilter),
    [cards, schoolFilter],
  );

  return (
    <div className="space-y-4">
      <ServiceSchoolFilter cards={cards} value={schoolFilter} onChange={setSchoolFilter} />
      <ServiceAttendanceImport
        serviceId={serviceId}
        kitchenMode={kitchenMode}
        presentTotal={presentTotal}
        className="w-full"
      />
      <ServiceClassGrid serviceId={serviceId} cards={filtered} hasMenu={hasMenu} />
    </div>
  );
}
