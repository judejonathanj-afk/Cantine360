import { PlatformShell } from "@/components/PlatformShell";

export default function PlatformSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlatformShell>{children}</PlatformShell>;
}
