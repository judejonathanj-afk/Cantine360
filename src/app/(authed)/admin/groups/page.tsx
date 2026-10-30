import { db } from "@/server/db";
import { getEstablishmentSessionForRole } from "@/server/auth";
import { getEstablishmentEcoSettings } from "@/server/establishmentEco";
import { getGroupsForAdmin } from "@/server/groupsForAdmin";
import { getSchoolsForAdmin } from "@/server/schoolsForAdmin";
import { redirectToEstablishmentLogin } from "@/lib/loginRedirect";
import { AdminGroupsClient } from "./ui";

export default async function AdminGroupsPage() {
  const session = await getEstablishmentSessionForRole("ADMIN");
  if (!session) return redirectToEstablishmentLogin("/admin/groups");

  const [groups, schools, establishmentEco] = await Promise.all([
    getGroupsForAdmin(db, session.establishmentId),
    getSchoolsForAdmin(db, session.establishmentId),
    getEstablishmentEcoSettings(db, session.establishmentId),
  ]);

  return (
    <AdminGroupsClient
      initialGroups={groups}
      initialSchools={schools}
      establishmentEco={
        establishmentEco ?? {
          ecoRestesServisTargetPct: null,
          ecoReductionTargetPct: null,
          ecoPeriodKind: "CALENDAR_YEAR",
          ecoSchoolYearStartMonth: 9,
          ecoSchoolYearStartDay: 1,
        }
      }
    />
  );
}
