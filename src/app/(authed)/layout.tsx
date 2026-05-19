import { AppShell } from "@/components/AppShell";
import { getServerSession } from "@/server/auth";
import { db } from "@/server/db";
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
  return (
    <AppShell
      role={session.role}
      establishmentLabel={establishment?.name ?? establishment?.slug}
    >
      {children}
    </AppShell>
  );
}

