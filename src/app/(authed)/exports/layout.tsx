import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth";

export default async function ExportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/service");
  return children;
}
