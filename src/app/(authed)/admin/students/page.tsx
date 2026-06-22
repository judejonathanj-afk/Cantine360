import { db } from "@/server/db";
import { getServerSession } from "@/server/auth";
import { getGroupsForAdmin } from "@/server/groupsForAdmin";
import { getStudentsForAdmin } from "@/server/studentsForAdmin";
import { redirect } from "next/navigation";
import { AdminStudentsClient } from "./ui";

export default async function AdminStudentsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/service");

  const [students, groups] = await Promise.all([
    getStudentsForAdmin(db, session.establishmentId),
    getGroupsForAdmin(db, session.establishmentId),
  ]);

  return <AdminStudentsClient initialStudents={students} groups={groups} />;
}
