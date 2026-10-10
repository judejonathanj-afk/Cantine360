import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import {
  establishmentSessionCookiesPresent,
  LEGACY_SESSION_COOKIE_NAME,
} from "@/server/auth-cookies";

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
    nextPath ??
    (await headers()).get("x-pathname") ??
    undefined;
  redirect(`/login${loginQueryForRedirect({ next: pathname, hadEstablishmentSession: hadSession })}`);
}
