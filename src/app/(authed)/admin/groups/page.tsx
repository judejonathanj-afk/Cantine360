import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getEstablishmentEcoSettings } from "@/server/establishmentEco";
import { getGroupsForAdmin } from "@/server/groupsForAdmin";
import { getSchoolsForAdmin } from "@/server/schoolsForAdmin";
import { getStudentsForAdmin } from "@/server/studentsForAdmin";
import { redirect } from "next/navigation";
import { AdminGroupsClient } from "./ui";

export default async function AdminGroupsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/service");

  const [groups, schools, establishmentEco, students] = await Promise.all([
    getGroupsForAdmin(db, session.establishmentId),
    getSchoolsForAdmin(db, session.establishmentId),
    getEstablishmentEcoSettings(db, session.establishmentId),
    getStudentsForAdmin(db, session.establishmentId),
  ]);

  return (
    <AdminGroupsClient
      initialGroups={groups}
      initialSchools={schools}
      studentSummary={{
        total: students.length,
        withAllergens: students.filter((s) => s.active && s.allergens.length > 0).length,
        noPork: students.filter((s) => s.active && s.noPork).length,
        vegetarian: students.filter((s) => s.active && s.vegetarian).length,
      }}
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
