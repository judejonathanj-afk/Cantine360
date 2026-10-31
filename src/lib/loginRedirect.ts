import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  establishmentSessionCookiesPresent,
  LEGACY_SESSION_COOKIE_NAME,
} from "@/server/auth-cookies";
import { pathnameFromHeaders } from "@/server/requestPathname";

function nextLooksSafe(next?: string): next is string {
  return (
    typeof next === "string" &&
    next.startsWith("/") &&
    !next.startsWith("//")
  );
}

function nextIsService(next: string): boolean {
  return next === "/service" || next.startsWith("/service/");
}

function nextIsKitchenDashboard(next: string): boolean {
  return next === "/dashboard" || next.startsWith("/dashboard/");
}

function nextIsAdminArea(next: string): boolean {
  return (
    next.startsWith("/admin") ||
    next.startsWith("/antigaspillage") ||
    next.startsWith("/exports")
  );
}

/**
 * Session expirée / absente : ne jamais échanger admin ↔ cuisine.
 * `null` = page de login (le rôle se choisit par le PIN).
 */
export function unauthenticatedPathRedirect(
  _pathname: string,
  _hasAdminSession: boolean,
  _hasKitchenSession: boolean,
): null {
  return null;
}

/** Accueil après PIN : la cuisine ne suit jamais une URL admin, et l’inverse. */
export function loginRedirectTo(
  role: "ADMIN" | "KITCHEN",
  requestedNext?: string,
): string {
  const defaultHome = role === "ADMIN" ? "/admin/dashboard" : "/service";
  if (!nextLooksSafe(requestedNext)) return defaultHome;
  if (role === "ADMIN" && (nextIsService(requestedNext) || nextIsKitchenDashboard(requestedNext))) {
    return defaultHome;
  }
  if (role === "KITCHEN" && nextIsAdminArea(requestedNext)) {
    return defaultHome;
  }
  return requestedNext;
}

export function loginQueryForRedirect(options: {
  next?: string | null;
  hadEstablishmentSession: boolean;
}): string {
  const params = new URLSearchParams();
  if (options.next && options.next.startsWith("/") && !options.next.startsWith("//")) {
    params.set("next", options.next);
  }
  if (options.hadEstablishmentSession) {
    params.set("reason", "expired");
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function hadEstablishmentSessionCookies(
  getCookie: (name: string) => string | undefined,
): boolean {
  return (
    establishmentSessionCookiesPresent(getCookie) ||
    Boolean(getCookie(LEGACY_SESSION_COOKIE_NAME))
  );
}

/** Redirection login avec message si des cookies de session étaient encore présents. */
export async function redirectToEstablishmentLogin(nextPath?: string): Promise<never> {
  const jar = await cookies();
  const getCookie = (name: string) => jar.get(name)?.value;
  const hadSession = hadEstablishmentSessionCookies(getCookie);
  const pathname =
    nextPath || pathnameFromHeaders(await headers()) || undefined;
  redirect(`/login${loginQueryForRedirect({ next: pathname, hadEstablishmentSession: hadSession })}`);
}
