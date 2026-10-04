import { FlushServiceMetrics } from "@/components/service/FlushServiceMetrics";

export default function ServiceSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FlushServiceMetrics />
      {children}
    </>
  );
}
