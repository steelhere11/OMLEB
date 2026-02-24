import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  // 1. Refresh auth tokens via updateSession
  const supabaseResponse = await updateSession(request);

  // 2. Build a read-only Supabase client from the refreshed cookies
  //    to check the current user's role.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op: cookies were already set by updateSession above.
          // This client is read-only for role checking.
        },
      },
    }
  );

  // IMPORTANT: Use getUser() not getSession() for security.
  // getUser() validates the JWT against Supabase Auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Public paths that never redirect ──────────────────────────
  const isLoginPage = pathname === "/login";
  const isAdminLoginPage = pathname === "/admin/login";
  const isAuthCallback = pathname.startsWith("/auth/callback");

  if (isAuthCallback) {
    return supabaseResponse;
  }

  // ── Role-based routing ────────────────────────────────────────
  const isAdminRoute = pathname.startsWith("/admin");
  const isTecnicoRoute = pathname.startsWith("/tecnico");
  const role = user?.app_metadata?.rol as string | undefined;

  // Unauthenticated user
  if (!user) {
    if (isAdminRoute && !isAdminLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    if (isTecnicoRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Authenticated user hitting a login page -- redirect to dashboard
  if (isLoginPage || isAdminLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : "/tecnico";
    return NextResponse.redirect(url);
  }

  // Authenticated non-admin hitting /admin/* -> redirect to /tecnico
  if (isAdminRoute && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/tecnico";
    return NextResponse.redirect(url);
  }

  // Authenticated admin hitting /tecnico/* -> redirect to /admin
  if (isTecnicoRoute && role === "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher:
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
};
