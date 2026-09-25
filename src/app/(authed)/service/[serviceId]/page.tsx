import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  ServiceAllergenOverview,
} from "@/components/service/ServiceAllergenPanel";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { ServiceDietBanner } from "@/components/service/ServiceDietBanner";
import { ServiceDietStudentsPanel } from "@/components/service/ServiceDietStudentsPanel";
import { type ServiceClassCard } from "@/components/service/ServiceClassGrid";
import { ServiceMetricsSection } from "@/components/service/ServiceMetricsSection";
import { ServiceGrammagePanel } from "@/components/service/ServiceGrammagePanel";
import { ServiceWasteWeightPanel } from "@/components/service/ServiceWasteWeightPanel";
import { ServiceInfoGrid } from "@/components/service/ServiceInfoGrid";
import { getServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { getEstablishmentAntiWasteSettings } from "@/server/establishmentAntiWaste";
import { getAntiWasteKitchenAdvice } from "@/server/getAntiWasteKitchenAdvice";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { serviceId } = await params;
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId: session.establishmentId },
    include: {
      menu: { include: { items: true } },
      metrics: {
        include: { group: { include: { school: true } } },
        orderBy: [{ group: { school: { name: "asc" } } }, { group: { name: "asc" } }],
      },
    },
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
    presentCount: m.presentCount,
    servedCount: m.servedCount,
    rabCount: m.rabCount,
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
    <div className="space-y-6">
      <div className="min-w-0 space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Saisie par classe</h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
          Appuyez sur une <strong className="font-semibold text-zinc-800">classe</strong> pour
          ouvrir le compteur, remplissez les chiffres (présents, servis, RAB, refus), puis{" "}
          <strong className="font-semibold text-zinc-800">Enregistrer</strong>. Les déchets se
          saisissent en grammes en fin de service.
        </p>
        <ServiceMealTitle
          mealType={service.mealType}
          dateLabel={dateLabel}
          className="w-full justify-center"
        />
      </div>

      <ServiceInfoGrid>
        {allergenSummary && session.role === "ADMIN" ? (
          <ServiceAllergenOverview summary={allergenSummary} />
        ) : null}
        {allergenSummary ? (
          <ServiceDietBanner summary={allergenSummary} />
        ) : null}
        <ServiceGrammagePanel menuItems={menuItems} metrics={metricsGrammage} />
        {allergenSummary ? (
          <ServiceDietStudentsPanel
            groups={allergenSummary.groups}
            hasMenu={allergenSummary.hasMenu}
            groupLevelById={groupLevelById}
            className="col-span-full"
          />
        ) : null}
      </ServiceInfoGrid>

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
            showCsvImport={session.role === "ADMIN"}
            presentTotal={service.metrics.reduce((sum, m) => sum + m.presentCount, 0)}
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
        kitchenAdvice={kitchenAdvice}
        servedCount={service.metrics.reduce((sum, m) => sum + m.servedCount, 0)}
        rabCount={service.metrics.reduce((sum, m) => sum + m.rabCount, 0)}
        refusedCount={service.metrics.reduce(
          (sum, m) => sum + m.refusedCount,
          0,
        )}
        targetGPer100={antiWaste.antiWasteTargetGPer100}
        mainLabels={menuItems
          .filter((i) => i.category === "MAIN" && i.label.trim())
          .map((i) => i.label)}
        allLabels={menuItems
          .filter((i) => i.label.trim())
          .map((i) => i.label)}
      />
    </div>
  );
}
