"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Utensils,
  BarChart3,
  FileDown,
  LogOut,
  ChefHat,
  Users,
  ClipboardList,
  GraduationCap,
  Recycle,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OfflineSyncBanner } from "@/components/service/OfflineSyncBanner";
import { EndServiceButton } from "@/components/service/EndServiceButton";
import {
  activeServiceIdFromPathname,
  readRememberedServiceId,
  rememberActiveServiceId,
} from "@/lib/activeService";
import {
  adminShouldLeaveKitchenPath,
  shellRoleForPathname,
} from "@/lib/uiRole";
type Props = {
  role: "ADMIN" | "KITCHEN";
  establishmentLabel?: string;
  initialServiceId?: string | null;
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

const LIME = "#d1f18d";

function isNavActive(item: NavItem, pathname: string) {
  return item.isActive
    ? item.isActive(pathname)
    : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function AppShell({
  role,
  establishmentLabel,
  initialServiceId = null,
  children,
}: Props) {
  const pathname = usePathname();
  const shellRole = shellRoleForPathname(pathname, role);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (role === "ADMIN" && adminShouldLeaveKitchenPath(pathname)) {
      window.location.replace("/admin/dashboard");
    }
  }, [role, pathname]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try {
      localStorage.removeItem("cantine360-night-mode");
    } catch {
      /* ignore */
    }
  }, []);
  const [rememberedServiceId, setRememberedServiceId] = useState<string | null>(
    initialServiceId,
  );

  async function logout() {
    setBusy(true);
    try {
      rememberActiveServiceId(null);
      setRememberedServiceId(null);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: shellRole }),
      });
      window.location.assign("/login");
    } finally {
      setBusy(false);
    }
  }

  const isServiceHome = pathname === "/service";
  const isServiceArea =
    isServiceHome || (pathname.startsWith("/service/") && pathname.length > "/service/".length);
  const pathnameServiceId = activeServiceIdFromPathname(pathname);

  useEffect(() => {
    if (pathnameServiceId) {
      rememberActiveServiceId(pathnameServiceId);
      setRememberedServiceId(pathnameServiceId);
      return;
    }
    if (isServiceHome) {
      rememberActiveServiceId(null);
      setRememberedServiceId(null);
      return;
    }
    // Admin : hors d’une URL /service/[id], le service n’est pas considéré ouvert
    // (évite Menu & allergènes après connexion / sur le dashboard).
    if (shellRole === "ADMIN") {
      rememberActiveServiceId(null);
      setRememberedServiceId(null);
      return;
    }
    // Cuisine : garder le service ouvert dans l’onglet si on va sur le dashboard.
    const fromStorage = readRememberedServiceId() ?? initialServiceId;
    if (fromStorage) rememberActiveServiceId(fromStorage);
    setRememberedServiceId(fromStorage);
  }, [pathnameServiceId, isServiceHome, initialServiceId, shellRole]);

  // Sur /service (accueil), ne pas réutiliser un id après « Fin de service ».
  // Admin : uniquement l’URL courante ouvre Menu & allergènes.
  const serviceId =
    pathnameServiceId ??
    (shellRole === "ADMIN" || isServiceHome ? null : rememberedServiceId) ??
    null;
  const showEndServiceButton = pathnameServiceId != null;

  const serviceNavItems: NavItem[] = serviceId
    ? [
        {
          href: `/service/${serviceId}/menu`,
          label: "Menu & allergènes",
          icon: ClipboardList,
          isActive: (p: string) =>
            p === `/service/${serviceId}/menu` ||
            p.startsWith(`/service/${serviceId}/menu/`),
        },
        {
          ...NAV[0],
          href: `/service/${serviceId}`,
        },
      ]
    : [NAV[0]];

  const antiWasteNav: NavItem | null =
    shellRole === "ADMIN"
      ? {
          href: "/antigaspillage",
          label: "Anti-gaspillage",
          icon: Recycle,
          isActive: (p: string) =>
            p === "/antigaspillage" || p.startsWith("/antigaspillage/"),
        }
      : null;

  const adminDashboard: NavItem = {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    isActive: (p) =>
      p === "/admin/dashboard" || p.startsWith("/admin/dashboard/"),
  };

  const navItems: NavItem[] =
    shellRole === "ADMIN"
      ? [
          adminDashboard,
          ...(antiWasteNav ? [antiWasteNav] : []),
          { href: "/admin/groups", label: "Écoles & classes", icon: Users },
          {
            href: "/admin/students",
            label: "Élèves & allergènes",
            icon: GraduationCap,
          },
          { href: "/exports", label: "Exports", icon: FileDown },
        ]
      : serviceId
        ? [
            ...serviceNavItems,
            NAV[1],
            ...(antiWasteNav ? [antiWasteNav] : []),
          ]
        : [...serviceNavItems, ...(antiWasteNav ? [antiWasteNav] : [])];

  const serviceShellClass = isServiceArea ? "bg-white" : null;

  const homeHref = shellRole === "ADMIN" ? "/admin/dashboard" : "/service";

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-1 flex-col",
        serviceShellClass ?? "bg-background",
      )}
    >
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-3 rounded-full border border-black/[0.06] bg-white px-3 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:gap-4 sm:px-5 sm:py-2.5">
            <Link
              href={homeHref}
              className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
              onClick={() => setMenuOpen(false)}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black sm:h-11 sm:w-11 sm:rounded-[14px]">
                <ChefHat className="h-5 w-5 text-[#d1f18d]" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[17px] font-extrabold uppercase tracking-[-0.04em] text-black sm:text-[19px]">
                  Cantine360
                </span>
                <span className="mt-0.5 hidden truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45 sm:block">
                  {shellRole === "ADMIN" ? "Admin" : "Cuisine"}
                  {establishmentLabel ? ` · ${establishmentLabel}` : ""}
                </span>
              </span>
            </Link>

            <nav
              aria-label="Navigation principale"
              className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:gap-2 lg:flex"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.08em] transition-colors xl:px-3.5 xl:text-[13px]",
                      active
                        ? "bg-black text-white"
                        : "text-black hover:bg-black/[0.06]",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              {showEndServiceButton ? (
                <EndServiceButton capsule />
              ) : (
                <>
                  <button
                    type="button"
                    onClick={logout}
                    disabled={busy}
                    className="group hidden items-stretch overflow-hidden rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-60 sm:flex"
                  >
                    <span className="flex items-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:px-5 sm:text-[11px]">
                      {busy ? "..." : "Déconnexion"}
                    </span>
                    <span
                      className="flex w-11 items-center justify-center transition-transform group-hover:scale-105 sm:w-12"
                      style={{ backgroundColor: LIME }}
                    >
                      <LogOut size={16} strokeWidth={2.5} className="text-black" />
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Déconnexion"
                    onClick={logout}
                    disabled={busy}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 sm:hidden"
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: LIME }}
                    >
                      <LogOut size={15} className="text-black" />
                    </span>
                  </button>
                </>
              )}

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 lg:hidden"
                aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={menuOpen}
                aria-controls="app-mobile-navigation"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {menuOpen ? (
            <nav
              id="app-mobile-navigation"
              aria-label="Navigation mobile"
              className="mt-3 rounded-3xl border border-black/[0.06] bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.08)] lg:hidden"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(item, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 border-b border-zinc-100 py-3.5 text-sm font-extrabold uppercase tracking-[0.08em] last:border-0",
                      active ? "text-black" : "text-black/75",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                    {item.label}
                  </Link>
                );
              })}
              {showEndServiceButton ? (
                <div className="mt-3">
                  <EndServiceButton className="w-full rounded-full" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={logout}
                  disabled={busy}
                  className="mt-3 flex w-full items-center justify-between rounded-full bg-red-600 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {busy ? "..." : "Déconnexion"}
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: LIME }}
                  >
                    <ArrowRight size={16} className="text-black" />
                  </span>
                </button>
              )}
            </nav>
          ) : null}
        </div>
      </header>

      <OfflineSyncBanner />

      <main
        className={cn(
          "relative z-10 mx-auto w-full flex-1",
          isServiceHome
            ? cn("max-w-none px-0 py-0", serviceShellClass)
            : isServiceArea
              ? cn("max-w-7xl px-4 py-8 sm:px-6 lg:px-8", serviceShellClass)
              : "max-w-7xl px-4 py-8 sm:px-6 lg:px-8",
        )}
      >
        {children}
      </main>
    </div>
  );
}
