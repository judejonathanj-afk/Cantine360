import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { getServiceAllergenSummary } from "@/server/serviceAllergenSummary";
import { getEstablishmentAntiWasteSettings } from "@/server/establishmentAntiWaste";
import { getDishWasteHistoryByLabel } from "@/server/getGrammageHistoryByLabel";
import { readServiceScreen } from "@/server/serviceScreenRead";
import { MenuEditor } from "./ui";

export default async function ServiceMenuPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin/groups");

  const { serviceId } = await params;
  const [service, allergenSummary, antiWaste] = await Promise.all([
    readServiceScreen(db, {
      establishmentId: session.establishmentId,
      serviceId,
    }),
    getServiceAllergenSummary(db, session.establishmentId, serviceId),
    getEstablishmentAntiWasteSettings(db, session.establishmentId),
  ]);
  if (!service) notFound();

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
  }).format(service.date);

  const initialItems =
    (service.menu?.items ?? [])
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((i) => ({
        category: i.category,
        label: i.label,
        allergens: i.allergens,
        grammageG: i.grammageG,
        containsPork: Boolean(
          "containsPork" in i && (i as { containsPork?: boolean }).containsPork,
        ),
        containsMeat: Boolean(
          "containsMeat" in i && (i as { containsMeat?: boolean }).containsMeat,
        ),
      }));

  const dishWasteHistoryByLabel = antiWaste.antiWasteModeEnabled
    ? await getDishWasteHistoryByLabel(
        db,
        session.establishmentId,
        serviceId,
        service.mealType,
      )
    : {};

  const dishImpact = new Map(
    allergenSummary?.dishes.map((d) => [`${d.category}:${d.label}`, d.affectedStudents]) ?? [],
  );

  return (
    <div className="-mt-3 space-y-5 md:-mt-5">
      <div className="flex flex-col items-center gap-1 px-2 text-center">
        <p className="text-zinc-600">
          <ServiceMealTitle
            mealType={service.mealType}
            dateLabel={dateLabel}
            size="sm"
          />
        </p>
        <MenusCantineColorTitle
          text="Menu du jour"
          className="text-xl md:text-2xl lg:text-3xl"
        />
        <hr
          className="mx-auto mt-2 h-0.5 w-full max-w-2xl rounded-full border-0 bg-emerald-500"
          aria-hidden
        />
      </div>

      <MenuEditor
        serviceId={serviceId}
        initialItems={initialItems}
        dishImpact={Object.fromEntries(dishImpact)}
        antiWasteModeEnabled={antiWaste.antiWasteModeEnabled}
        dishWasteHistoryByLabel={dishWasteHistoryByLabel}
        targetGPer100={antiWaste.antiWasteTargetGPer100}
      />
    </div>
  );
}
