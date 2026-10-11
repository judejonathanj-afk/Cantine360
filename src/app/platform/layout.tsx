import "@/styles/platform-refonte.css";
import { PlatformPaletteProvider } from "@/components/platform/PlatformPaletteProvider";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformPaletteProvider>{children}</PlatformPaletteProvider>;
}
