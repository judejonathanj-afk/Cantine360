import { getEstablishmentSessionForRole } from "@/server/auth";
import { redirectToEstablishmentLogin } from "@/lib/loginRedirect";
import ServiceHomeClient from "./ServiceHomeClient";

export default async function ServiceHomePage() {
  const session = await getEstablishmentSessionForRole("KITCHEN");
  if (!session) return redirectToEstablishmentLogin("/service");
  return <ServiceHomeClient />;
}
