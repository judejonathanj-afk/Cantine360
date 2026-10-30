import { db } from "@/server/db";
import { getEstablishmentSessionForRole } from "@/server/auth";
import { getGroupsForAdmin } from "@/server/groupsForAdmin";
import { getStudentsForAdmin } from "@/server/studentsForAdmin";
import { redirectToEstablishmentLogin } from "@/lib/loginRedirect";
import { AdminStudentsClient } from "./ui";

export default async function AdminStudentsPage() {
  const session = await getEstablishmentSessionForRole("ADMIN");
  if (!session) return redirectToEstablishmentLogin("/admin/students");

  const [students, groups] = await Promise.all([
    getStudentsForAdmin(db, session.establishmentId),
    getGroupsForAdmin(db, session.establishmentId),
  ]);

  return <AdminStudentsClient initialStudents={students} groups={groups} />;
}
