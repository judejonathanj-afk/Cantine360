import { AppShell } from "@/components/AppShell";
import { activeServiceIdFromPathname } from "@/lib/activeService";
import { getEstablishmentSessionForRole } from "@/server/auth";
import { sessionRoleForPath } from "@/server/auth-cookies";
import { pathnameFromHeaders } from "@/server/requestPathname";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { redirectToEstablishmentLogin } from "@/lib/loginRedirect";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = pathnameFromHeaders(await headers());
  const wantRole = sessionRoleForPath(pathname);
  if (!pathname || !wantRole) {
    return redirectToEstablishmentLogin(pathname || undefined);
  }
  const session = await getEstablishmentSessionForRole(wantRole);
  if (!session) {
    return redirectToEstablishmentLogin(pathname);
  }
  let establishment: { name: string | null; slug: string | null } | null = null;
  try {
    establishment = await db.establishment.findUnique({
      where: { id: session.establishmentId },
      select: { name: true, slug: true },
    });
  } catch (e) {
    console.error("[layout] establishment", e);
  }
  const initialServiceId = activeServiceIdFromPathname(pathname);
  return (
    <AppShell
      role={session.role}
      establishmentLabel={establishment?.name ?? establishment?.slug ?? undefined}
      initialServiceId={initialServiceId}
    >
      {children}
    </AppShell>
  );
}
