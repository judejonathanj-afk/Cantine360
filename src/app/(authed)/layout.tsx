import { AppShell } from "@/components/AppShell";
import { activeServiceIdFromPathname } from "@/lib/activeService";
import {
  getEstablishmentSessionForRole,
  getServerSession,
} from "@/server/auth";
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
  const session = wantRole
    ? await getEstablishmentSessionForRole(wantRole)
    : await getServerSession();
  if (!session) {
    return redirectToEstablishmentLogin(pathname || undefined);
  }
  if (wantRole && session.role !== wantRole) {
    return redirectToEstablishmentLogin(pathname || undefined);
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
