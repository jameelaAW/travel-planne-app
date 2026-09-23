import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, skip the auth refresh and pass through.
  // Without this guard createServerClient throws "Your project's URL and Key
  // are required", crashing the edge middleware on every route (500
  // MIDDLEWARE_INVOCATION_FAILED).
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  try {
    let response = supabaseResponse;
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh session so it doesn't expire while user is active
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Login wall (Sprint 5). DEMO_MODE=true keeps the v1 open demo.
    const path = request.nextUrl.pathname;
    const isPublic = path === "/login" || path.startsWith("/auth/") || path.startsWith("/api/health");
    if (process.env.DEMO_MODE !== "true") {
      const redirectTo = (target: URL) => {
        const r = NextResponse.redirect(target);
        response.cookies.getAll().forEach((c) => r.cookies.set(c)); // keep refreshed session cookies
        return r;
      };
      if (!user && !isPublic) {
        const login = new URL("/login", request.url);
        if (path !== "/") login.searchParams.set("next", path + request.nextUrl.search);
        return redirectTo(login);
      }
      if (user && path === "/login") return redirectTo(new URL("/", request.url));
    }
    return response;
  } catch {
    // Never let an auth hiccup crash the entire edge middleware
    return supabaseResponse;
  }
}
