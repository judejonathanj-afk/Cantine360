import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { formatGroupLabel } from "@/lib/groupLabel";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { ClassAllergenList } from "@/components/service/ClassAllergenList";
import { GroupMetricsEditor } from "./ui";

export default async function GroupMetricsPage({
  params,
}: {
  params: Promise<{ serviceId: string; groupId: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { serviceId, groupId } = await params;

  const metrics = await db.serviceGroupMetrics.findFirst({
    where: {
      serviceId,
      groupId,
      service: { establishmentId: session.establishmentId },
    },
    include: { group: { include: { school: true } }, service: true },
  });
  if (!metrics) notFound();

  const allergenSummary = await getServiceAllergenSummary(
    db,
    session.establishmentId,
    serviceId,
  );
  const groupAllergens = allergenSummary?.groups.find((g) => g.groupId === groupId);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
  }).format(metrics.service.date);

  return (
    <div className="space-y-6">
      <GroupMetricsEditor
        serviceId={serviceId}
        groupId={groupId}
        groupName={formatGroupLabel(metrics.group.school.name, metrics.group.name)}
        className={metrics.group.name}
        schoolName={metrics.group.school.name}
        mealType={metrics.service.mealType}
        dateLabel={dateLabel}
        level={metrics.group.level === "MATERNELLE" ? "MATERNELLE" : "PRIMAIRE"}
        initial={{
          presentCount: metrics.presentCount,
          servedCount: metrics.servedCount,
          rabCount: metrics.rabCount,
          refusedCount: metrics.refusedCount,
        }}
      />
      {groupAllergens ? (
        <section className="space-y-4">
          <div className="border-t border-zinc-300 pt-6" role="separator" aria-hidden />
          <h2 className="flex items-center justify-center gap-2.5 text-2xl font-semibold text-zinc-900 sm:text-3xl">
            <AlertTriangle
              className="h-7 w-7 shrink-0 text-yellow-500 sm:h-8 sm:w-8"
              aria-hidden
            />
            Élèves &amp; allergènes
          </h2>
          <ClassAllergenList
            students={groupAllergens.students}
            hasMenu={allergenSummary?.hasMenu ?? false}
          />
        </section>
      ) : null}
    </div>
  );
}

