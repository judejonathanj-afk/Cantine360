import { PlatformShell } from "@/components/PlatformShell";

export default function PlatformEstablishmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformShell>{children}</PlatformShell>;
}
