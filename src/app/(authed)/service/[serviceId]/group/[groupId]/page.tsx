import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
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
    include: { group: true, service: true },
  });
  if (!metrics) notFound();

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
  }).format(metrics.service.date);

  return (
    <GroupMetricsEditor
      serviceId={serviceId}
      groupId={groupId}
      groupName={metrics.group.name}
      mealType={metrics.service.mealType}
      dateLabel={dateLabel}
      initial={{
        presentCount: metrics.presentCount,
        servedCount: metrics.servedCount,
        refusedCount: metrics.refusedCount,
        leftoversCount: metrics.leftoversCount,
      }}
    />
  );
}

