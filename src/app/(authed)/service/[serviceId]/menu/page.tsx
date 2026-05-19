import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { MenuEditor } from "./ui";

export default async function ServiceMenuPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { serviceId } = await params;
  const service = await db.service.findFirst({
    where: { id: serviceId, establishmentId: session.establishmentId },
    include: { menu: { include: { items: true } } },
  });
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
      }));

  return (
    <div className="-mt-3 space-y-5 md:-mt-5">
      <div className="relative">
        <Link
          href={`/service/${serviceId}`}
          className="absolute left-0 top-0 z-10 inline-flex items-center rounded-xl border border-emerald-700 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800"
        >
          Retour
        </Link>
        <div className="flex flex-col items-center gap-1 px-2 text-center sm:px-24">
          <p className="text-zinc-600">
            <ServiceMealTitle
              mealType={service.mealType}
              dateLabel={dateLabel}
              size="sm"
            />
          </p>
          <MenusCantineColorTitle />
          <hr
            className="mx-auto mt-3 h-1 w-full max-w-4xl rounded-full border-0 bg-emerald-500"
            aria-hidden
          />
        </div>
      </div>

      <MenuEditor serviceId={serviceId} initialItems={initialItems} />
    </div>
  );
}

