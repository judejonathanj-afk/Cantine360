import { redirect } from "next/navigation";
import { getEstablishmentSessionForRole } from "@/server/auth";
import { redirectToEstablishmentLogin } from "@/lib/loginRedirect";

export default async function AdminAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getEstablishmentSessionForRole("ADMIN");
  if (admin) return children;

  const kitchen = await getEstablishmentSessionForRole("KITCHEN");
  if (kitchen) redirect("/service");

  return redirectToEstablishmentLogin();
}
