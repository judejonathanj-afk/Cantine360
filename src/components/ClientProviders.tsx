"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
