import { PlatformEstablishmentEditClient } from "./ui";

export default async function PlatformEstablishmentEditPage({
  params,
}: {
  params: Promise<{ establishmentId: string }>;
}) {
  const { establishmentId } = await params;
  return <PlatformEstablishmentEditClient establishmentId={establishmentId} />;
}
