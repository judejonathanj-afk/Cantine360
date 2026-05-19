"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Leaf,
  Utensils,
  BarChart3,
  FileDown,
  LogOut,
  ChefHat,
  Users,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  role: "ADMIN" | "KITCHEN";
  establishmentLabel?: string;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof Utensils;
  isActive?: (pathname: string) => boolean;
};

const NAV: NavItem[] = [
  {
    href: "/service",
    label: "Service",
    icon: Utensils,
    isActive: (pathname) => {
      if (pathname === "/service") return true;
      const m = pathname.match(/^\/service\/([^/]+)(?:\/(.*))?$/);
      if (!m) return false;
      const rest = m[2] ?? "";
      return !rest.startsWith("menu");
    },
  },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
];

function renderNavItems(
  variant: "desktop" | "mobile",
  navItems: NavItem[],
  pathname: string,
) {
  return navItems.map((item) => {
    const Icon = item.icon;
    const active = item.isActive
      ? item.isActive(pathname)
      : pathname === item.href || pathname.startsWith(item.href + "/");
    if (variant === "desktop") {
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            active
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {active ? (
            <span className="absolute inset-0 rounded-full bg-primary shadow-lg shadow-primary/25" />
          ) : null}
          <span className="relative z-10 flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {item.label}
          </span>
        </Link>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
        {item.label}
      </Link>
    );
  });
}

export function AppShell({ role, establishmentLabel, children }: Props) {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/login");
    } finally {
      setBusy(false);
    }
  }

  const serviceId = pathname.match(/^\/service\/([^/]+)/)?.[1] ?? null;
  const isServiceHome = pathname === "/service";

  const navItems: NavItem[] = [
    {
      ...NAV[0],
      href: serviceId ? `/service/${serviceId}` : NAV[0].href,
    },
    ...(serviceId
      ? [
          {
            href: `/service/${serviceId}/menu`,
            label: "Menu & allergènes",
            icon: ClipboardList,
            isActive: (p: string) =>
              p === `/service/${serviceId}/menu` ||
              p.startsWith(`/service/${serviceId}/menu/`),
          } satisfies NavItem,
        ]
      : []),
    ...(role === "ADMIN"
      ? [
          NAV[1],
          { href: "/exports", label: "Exports", icon: FileDown } satisfies NavItem,
          { href: "/admin/groups", label: "Groupes", icon: Users } satisfies NavItem,
        ]
      : []),
  ];

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-1 flex-col pb-20 md:pb-0",
        !isServiceHome && "bg-background",
      )}
    >
      {isServiceHome ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 top-16 bg-[linear-gradient(135deg,#ffffff_50%,#d1fae5_55%,#6ee7b7_72%,#10b981_88%,#059669_100%)]"
        />
      ) : null}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/service" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">Cantine360</span>
              <div className="mt-0.5 flex flex-wrap items-center gap-1">
                <Badge variant="secondary" className="w-fit text-xs">
                  <ChefHat className="mr-1 h-3 w-3" />
                  {role === "ADMIN" ? "Admin" : "Cuisine"}
                </Badge>
                {establishmentLabel ? (
                  <Badge variant="outline" className="max-w-[200px] truncate text-xs">
                    {establishmentLabel}
                  </Badge>
                ) : null}
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-secondary/50 p-1 md:flex">
            {renderNavItems("desktop", navItems, pathname)}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={logout}
            disabled={busy}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">
              {busy ? "..." : "Déconnexion"}
            </span>
          </Button>
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8",
          isServiceHome && "bg-transparent",
        )}
      >
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/90 backdrop-blur-xl md:hidden">
        <div className="flex justify-around py-2">
          {renderNavItems("mobile", navItems, pathname)}
        </div>
      </nav>
    </div>
  );
}
