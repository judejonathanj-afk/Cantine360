import { AppShell } from "@/components/AppShell";
import { activeServiceIdFromPathname } from "@/lib/activeService";
import { getServerSession } from "@/server/auth";
import { db } from "@/server/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const establishment = await db.establishment.findUnique({
    where: { id: session.establishmentId },
    select: { name: true, slug: true },
  });
  const pathname = (await headers()).get("x-pathname") ?? "";
  const initialServiceId = activeServiceIdFromPathname(pathname);
  return (
    <AppShell
      role={session.role}
      establishmentLabel={establishment?.name ?? establishment?.slug}
      initialServiceId={initialServiceId}
    >
      {children}
    </AppShell>
  );
}

