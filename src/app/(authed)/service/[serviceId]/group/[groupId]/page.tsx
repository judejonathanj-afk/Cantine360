import { notFound, redirect } from "next/navigation";
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
        initial={{
          presentCount: metrics.presentCount,
          servedCount: metrics.servedCount,
          rabCount: metrics.rabCount,
          refusedCount: metrics.refusedCount,
          leftoversCount: metrics.leftoversCount,
        }}
      />
      {groupAllergens ? (
        <ClassAllergenList
          students={groupAllergens.students}
          hasMenu={allergenSummary?.hasMenu ?? false}
        />
      ) : null}
    </div>
  );
}

