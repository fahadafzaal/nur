import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

/**
 * Routes that require a signed-in account. Membership-tier gating (member
 * vs free) is enforced separately at the data layer in M5 — this is only
 * the signed-in/signed-out boundary.
 */
const PROTECTED_PREFIXES = [
  "/home",
  "/reminders",
  "/membership",
  "/quran",
  "/nasheeds",
  "/seerah",
  "/tasbeeh",
  "/health",
  "/shop/orders",
  "/admin",
];

/** Routes a signed-in user has no reason to see. */
const AUTH_ROUTES = ["/sign-in", "/join"];

export async function proxy(request: NextRequest) {
  // Until Supabase is configured, pass everything through rather than
  // throwing on every request — the splash screen stays viewable.
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refreshes an expiring token and writes the new cookie onto `response`.
  // Must run on every matched request or sessions silently expire.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — running auth on
     * those would be pure latency.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp3|woff2?)$).*)",
  ],
};
