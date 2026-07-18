import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  ServiceAllergenOverview,
} from "@/components/service/ServiceAllergenPanel";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { ServiceConcernedStudentsPanel } from "@/components/service/ServiceConcernedStudentsPanel";
import { type ServiceClassCard } from "@/components/service/ServiceClassGrid";
import { ServiceMetricsSection } from "@/components/service/ServiceMetricsSection";
import { ServiceGrammagePanel } from "@/components/service/ServiceGrammagePanel";
import { ServiceWasteWeightPanel } from "@/components/service/ServiceWasteWeightPanel";
import { ServiceInfoGrid } from "@/components/service/ServiceInfoGrid";
import { getServiceAllergenSummary } from "@/server/serviceAllergenSummary";

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

  const allergenSummary = await getServiceAllergenSummary(
    db,
    session.establishmentId,
    serviceId,
  );
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

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-col gap-3">
        <h1 className="w-full">
          <ServiceMealTitle
            mealType={service.mealType}
            dateLabel={dateLabel}
            className="w-full justify-start"
          />
        </h1>
        <div className="w-full space-y-2 text-pretty text-base leading-relaxed text-zinc-700 sm:text-lg">
          <p className="font-semibold text-zinc-900">Aide au flux de saisie</p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              <strong className="font-semibold text-zinc-900">Avant le repas</strong> — menu,
              allergènes et grammage, puis présents par classe (saisie ou import).
            </li>
            <li>
              <strong className="font-semibold text-zinc-900">Pendant / après</strong> — servis,
              RAB et refus sur chaque classe.
            </li>
            <li>
              <strong className="font-semibold text-zinc-900">Fin de service</strong> — poids des
              déchets en grammes, puis « Fin de service » en haut à droite.
            </li>
          </ol>
        </div>
      </div>

      <ServiceInfoGrid>
        {allergenSummary && session.role === "ADMIN" ? (
          <ServiceAllergenOverview summary={allergenSummary} />
        ) : null}
        <ServiceGrammagePanel menuItems={menuItems} metrics={metricsGrammage} />
        {allergenSummary ? (
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-900" />}>
            <ServiceConcernedStudentsPanel
              serviceId={serviceId}
              groups={allergenSummary.groups}
              hasMenu={allergenSummary.hasMenu}
              groupLevelById={groupLevelById}
            />
          </Suspense>
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
            kitchenMode={session.role === "KITCHEN"}
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
      />
    </div>
  );
}

