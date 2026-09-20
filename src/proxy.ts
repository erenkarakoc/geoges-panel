import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { readSupabaseConfig } from "@/platform/supabase/supabase-config";

/**
 * Next.js Proxy (Middleware before Next 16). Two jobs, both cheap:
 * refresh the Supabase session cookies on every request, and send signed-out visitors to the
 * sign-in screen. The real access decision — including the `aal2` step — is made again by the
 * protected layouts, because proxy checks are optimistic only (Next.js proxy guidance).
 */

const publicRoutes = [
  "/sign-in",
  "/two-factor",
  "/reset-password",
  "/update-password",
  "/auth/confirm",
];

function isPublicRoute(pathname: string): boolean {
  // Phase 06 spike route, development only; removed with the spike (SPIKE-07).
  if (process.env.NODE_ENV !== "production" && pathname.startsWith("/spike-flow")) {
    return true;
  }

  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request });
  const { url, publishableKey } = readSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && !isPublicRoute(request.nextUrl.pathname)) {
    const signInUrl = new URL("/sign-in", request.url);

    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|assets|favicon.ico).*)"],
};
