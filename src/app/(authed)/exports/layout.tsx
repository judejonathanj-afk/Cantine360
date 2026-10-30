import { getEstablishmentSessionForRole } from "@/server/auth";
import { redirectToEstablishmentLogin } from "@/lib/loginRedirect";

export default async function ExportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getEstablishmentSessionForRole("ADMIN");
  if (!session) return redirectToEstablishmentLogin("/exports");
  return children;
}
