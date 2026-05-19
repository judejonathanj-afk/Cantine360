import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GroupNameBadge } from "@/components/GroupNameBadge";
import { EndServiceButton } from "@/components/service/EndServiceButton";
import { ServiceMealTitle } from "@/components/service/ServiceMealTitle";
import { ServiceWorkflowHint } from "@/components/ServiceWorkflowHint";
import { groupCardColorForIndex } from "@/lib/groupCardColors";
import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";

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
      metrics: {
        include: { group: true },
        orderBy: [{ group: { name: "asc" } }],
      },
    },
  });
  if (!service) notFound();

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
  }).format(service.date);

  return (
    <div className="space-y-6">
      <div className="relative px-2">
        <EndServiceButton className="absolute left-0 top-0 z-10 hidden sm:inline-flex" />
        <div className="flex flex-col items-center gap-2 text-center">
          <h1>
            <ServiceMealTitle mealType={service.mealType} dateLabel={dateLabel} />
          </h1>
          <p className="text-sm text-zinc-600 md:text-base">
            Touchez un groupe pour saisir les compteurs.
          </p>
        </div>
        <EndServiceButton className="mt-4 sm:hidden" />
      </div>

      <ServiceWorkflowHint />

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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
          {service.metrics.map((m, index) => {
            const done =
              m.presentCount > 0 ||
              m.servedCount > 0 ||
              m.refusedCount > 0 ||
              m.leftoversCount > 0;
            const cardColor = groupCardColorForIndex(index);
            return (
              <Link
                key={m.groupId}
                href={`/service/${serviceId}/group/${m.groupId}`}
                className="relative rounded-2xl border-2 p-4 shadow-sm transition-all duration-200 ease-out hover:z-10 hover:scale-[1.04] hover:shadow-xl active:scale-[0.98]"
                style={{
                  backgroundColor: cardColor,
                  borderColor: cardColor,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <GroupNameBadge name={m.group.name} />
                  <span
                    className={[
                      "rounded-full px-2 py-1 text-xs font-semibold",
                      done
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-white/70 text-zinc-800",
                    ].join(" ")}
                  >
                    {done ? "Saisi" : "À faire"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 text-zinc-800">
                  <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                    <div className="text-sm font-medium text-zinc-600">Présents</div>
                    <div className="text-xl font-bold tabular-nums">{m.presentCount}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                    <div className="text-sm font-medium text-zinc-600">Servis</div>
                    <div className="text-xl font-bold tabular-nums">{m.servedCount}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                    <div className="text-sm font-medium text-zinc-600">Refus</div>
                    <div className="text-xl font-bold tabular-nums">{m.refusedCount}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                    <div className="text-sm font-medium text-zinc-600">Restes</div>
                    <div className="text-xl font-bold tabular-nums">{m.leftoversCount}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

