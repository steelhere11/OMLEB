import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const role = data.user.app_metadata?.rol as string | undefined;
      const redirectPath = role === "admin" ? "/admin" : "/tecnico";
      return NextResponse.redirect(new URL(redirectPath, origin));
    }
  }

  // If no code or exchange failed, redirect to login with error
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth_callback_error");
  return NextResponse.redirect(loginUrl);
}
