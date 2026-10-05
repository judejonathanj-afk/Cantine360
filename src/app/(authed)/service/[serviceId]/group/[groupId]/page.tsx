import { notFound, redirect } from "next/navigation";
import { formatGroupLabel } from "@/lib/groupLabel";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { readServiceScreen } from "@/server/serviceScreenRead";
import { GroupMetricsEditor } from "./ui";

export default async function GroupMetricsPage({
  params,
}: {
  params: Promise<{ serviceId: string; groupId: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { serviceId, groupId } = await params;

  const [service, allergenSummary] = await Promise.all([
    readServiceScreen(db, {
      establishmentId: session.establishmentId,
      serviceId,
    }),
    getServiceAllergenSummary(db, session.establishmentId, serviceId),
  ]);
  const metrics = service?.metrics.find((m) => m.groupId === groupId);
  if (!service || !metrics) notFound();
  const groupAllergens = allergenSummary?.groups.find((g) => g.groupId === groupId);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
  }).format(service.date);

  return (
    <GroupMetricsEditor
      serviceId={serviceId}
      groupId={groupId}
      groupName={formatGroupLabel(metrics.group.school.name, metrics.group.name)}
      className={metrics.group.name}
      schoolName={metrics.group.school.name}
      mealType={service.mealType}
      dateLabel={dateLabel}
      level={metrics.group.level === "MATERNELLE" ? "MATERNELLE" : "PRIMAIRE"}
      initial={{
        presentCount: metrics.presentCount,
        servedCount: metrics.servedCount,
        rabCount: metrics.rabCount,
        refusedCount: metrics.refusedCount,
      }}
      allergenStudents={groupAllergens?.students}
      hasMenu={allergenSummary?.hasMenu ?? false}
    />
  );
}
