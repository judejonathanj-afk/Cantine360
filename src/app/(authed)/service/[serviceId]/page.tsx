import { notFound, redirect } from "next/navigation";
import { EndServiceButton } from "@/components/service/EndServiceButton";
import {
  ServiceAllergenOverview,
} from "@/components/service/ServiceAllergenPanel";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { ServiceWorkflowHint } from "@/components/ServiceWorkflowHint";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { ServiceConcernedStudentsPanel } from "@/components/service/ServiceConcernedStudentsPanel";
import { type ServiceClassCard } from "@/components/service/ServiceClassGrid";
import { ServiceMetricsSection } from "@/components/service/ServiceMetricsSection";
import { ServiceGrammagePanel } from "@/components/service/ServiceGrammagePanel";
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
    presentCount: m.presentCount,
    servedCount: m.servedCount,
    rabCount: m.rabCount,
    refusedCount: m.refusedCount,
    leftoversCount: m.leftoversCount,
    groupSummary: summaryByGroup.get(m.groupId),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h1 className="w-full">
            <ServiceMealTitle
              mealType={service.mealType}
              dateLabel={dateLabel}
              className="w-full justify-start"
            />
          </h1>
          <p className="w-full text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg md:text-xl">
            Avant le repas : consultez le menu, les allergènes et le grammage, puis
            renseignez les présents par groupe (saisie ou import CSV). Après le
            repas : complétez servis, RAB, refus et restes pour chaque classe.
            Clôturez avec « Fin de service » lorsque tout est à jour.
          </p>
        </div>
        <EndServiceButton className="inline-flex shrink-0 self-start sm:ml-4" />
      </div>

      <ServiceInfoGrid>
        <ServiceWorkflowHint />
        {allergenSummary && session.role === "ADMIN" ? (
          <ServiceAllergenOverview summary={allergenSummary} />
        ) : null}
        <ServiceGrammagePanel menuItems={menuItems} metrics={metricsGrammage} />
        {allergenSummary ? (
          <ServiceConcernedStudentsPanel
            groups={allergenSummary.groups}
            hasMenu={allergenSummary.hasMenu}
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
        <ServiceMetricsSection
          serviceId={serviceId}
          kitchenMode={session.role === "KITCHEN"}
          presentTotal={service.metrics.reduce((sum, m) => sum + m.presentCount, 0)}
          cards={classCards}
          hasMenu={allergenSummary?.hasMenu ?? false}
        />
      )}
    </div>
  );
}

