import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth";
import ServiceHomeClient from "./ServiceHomeClient";

export default async function ServiceHomePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin/groups");
  return <ServiceHomeClient />;
}
