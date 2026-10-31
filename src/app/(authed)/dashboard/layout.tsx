import { getEstablishmentSessionForRole } from "@/server/auth";
import { redirectToEstablishmentLogin } from "@/lib/loginRedirect";

export default async function KitchenDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const kitchen = await getEstablishmentSessionForRole("KITCHEN");
  if (kitchen) return children;
  return redirectToEstablishmentLogin("/dashboard");
}
