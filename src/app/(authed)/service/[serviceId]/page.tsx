import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { type ServiceClassCard } from "@/components/service/ServiceClassGrid";
import { ServiceMetricsSection } from "@/components/service/ServiceMetricsSection";
import { ServiceDayInsightsPanel } from "@/components/service/ServiceDayInsightsPanel";
import { ServiceWasteWeightPanel } from "@/components/service/ServiceWasteWeightPanel";
import { EndServiceButton } from "@/components/service/EndServiceButton";
import { getServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { getEstablishmentAntiWasteSettings } from "@/server/establishmentAntiWaste";
import { getAntiWasteKitchenAdvice } from "@/server/getAntiWasteKitchenAdvice";
import { readServiceScreen } from "@/server/serviceScreenRead";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin/groups");

  const { serviceId } = await params;
  const service = await readServiceScreen(db, {
    establishmentId: session.establishmentId,
    serviceId,
  });
  if (!service) notFound();

  const hasFilledMenu = (service.menu?.items ?? []).some(
    (item) => item.label.trim().length > 0,
  );
  if (!hasFilledMenu) {
    redirect(`/service/${serviceId}/menu`);
  }

  const [antiWaste, allergenSummary] = await Promise.all([
    getEstablishmentAntiWasteSettings(db, session.establishmentId),
    getServiceAllergenSummary(db, session.establishmentId, serviceId),
  ]);
  const summaryByGroup = new Map(
    allergenSummary?.groups.map((g) => [g.groupId, g]) ?? [],
  );

  const menuItems = (service.menu?.items ?? []).map((i) => ({
    label: i.label,
    category: i.category,
    grammageG: i.grammageG,
  }));
  const metricsGrammage = service.metrics.map((m) => ({
    groupId: m.groupId,
    presentCount: m.presentCount,
    servedCount: m.servedCount,
    rabCount: m.rabCount,
    refusedCount: m.refusedCount,
  }));

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
  }).format(service.date);

  const classCards: ServiceClassCard[] = service.metrics.map((m) => ({
    groupId: m.groupId,
    groupName: m.group.name,
    schoolName: m.group.school.name,
    level: m.group.level === "MATERNELLE" ? "MATERNELLE" : "PRIMAIRE",
    presentCount: m.presentCount,
    servedCount: m.servedCount,
    rabCount: m.rabCount,
    refusedCount: m.refusedCount,
    groupSummary: summaryByGroup.get(m.groupId),
  }));

  const groupLevelById = Object.fromEntries(
    classCards.map((card) => [card.groupId, card.level]),
  );

  const kitchenAdvice = antiWaste.antiWasteModeEnabled
    ? await getAntiWasteKitchenAdvice({
        db,
        establishmentId: session.establishmentId,
        serviceId,
        serviceDate: service.date,
        mealType: service.mealType,
        menuItems,
        metrics: classCards.map((c) => ({
          presentCount: c.presentCount,
          servedCount: c.servedCount,
          rabCount: c.rabCount,
          level: c.level,
        })),
        targetGPer100: antiWaste.antiWasteTargetGPer100,
      })
    : null;

  return (
    <div className="-mt-3 space-y-6 md:-mt-5">
      <div className="flex flex-col items-center gap-1 px-2 text-center">
        <p className="text-zinc-600">
          <ServiceMealTitle
            mealType={service.mealType}
            dateLabel={dateLabel}
            size="sm"
          />
        </p>
        <MenusCantineColorTitle
          text="Saisie par classe"
          className="text-xl md:text-2xl lg:text-3xl"
        />
        <hr
          className="mx-auto mt-2 h-0.5 w-full max-w-2xl rounded-full border-0 bg-emerald-500"
          aria-hidden
        />
      </div>

      <ServiceDayInsightsPanel
        serviceId={serviceId}
        allergenSummary={allergenSummary}
        groupLevelById={groupLevelById}
        menuItems={menuItems}
        metricsGrammage={metricsGrammage}
        antiWasteModeEnabled={antiWaste.antiWasteModeEnabled}
        kitchenAdvice={kitchenAdvice}
        classCounts={classCards.map((card) => ({
          groupId: card.groupId,
          level: card.level,
          presentCount: card.presentCount,
          servedCount: card.servedCount,
          rabCount: card.rabCount,
          refusedCount: card.refusedCount,
        }))}
        initialWasteWeightG={service.wasteWeightG}
        initialWasteWeightMaternelleG={service.wasteWeightMaternelleG}
        initialWasteWeightPrimaireG={service.wasteWeightPrimaireG}
      />

      {service.metrics.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-700">
            Aucun groupe actif. Demandez à l’admin d’ajouter des groupes.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            (Admin → Groupes)
          </p>
        </div>
      ) : (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />}>
          <ServiceMetricsSection
            serviceId={serviceId}
            showCsvImport={false}
            cards={classCards}
            hasMenu={allergenSummary?.hasMenu ?? false}
          />
        </Suspense>
      )}

      <ServiceWasteWeightPanel
        key={serviceId}
        serviceId={serviceId}
        initialWasteWeightG={service.wasteWeightG}
        initialWasteWeightMaternelleG={service.wasteWeightMaternelleG}
        initialWasteWeightPrimaireG={service.wasteWeightPrimaireG}
        antiWasteModeEnabled={antiWaste.antiWasteModeEnabled}
        classCounts={classCards.map((card) => ({
          groupId: card.groupId,
          level: card.level,
          presentCount: card.presentCount,
          servedCount: card.servedCount,
          rabCount: card.rabCount,
          refusedCount: card.refusedCount,
        }))}
        targetGPer100={antiWaste.antiWasteTargetGPer100}
        mainLabels={menuItems
          .filter((i) => i.category === "MAIN" && i.label.trim())
          .map((i) => i.label)}
        allLabels={menuItems
          .filter((i) => i.label.trim())
          .map((i) => i.label)}
      />

      <div className="mx-auto flex max-w-6xl justify-center px-1 pt-2 sm:px-2">
        <EndServiceButton banner />
      </div>
    </div>
  );
}
