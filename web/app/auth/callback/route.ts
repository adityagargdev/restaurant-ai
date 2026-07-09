import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  // Supabase/Google returned an error before we even got a code
  if (oauthError) {
    console.error("[auth/callback] OAuth provider error:", oauthError, oauthErrorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}&details=${encodeURIComponent(oauthErrorDescription ?? "")}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=exchange_failed&details=${encodeURIComponent(error.message)}`
      );
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", data.user.id)
        .single();

      if (!profile?.phone) {
        return NextResponse.redirect(`${origin}/setup-profile`);
      }
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    console.error("[auth/callback] exchangeCodeForSession returned no user and no error");
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  console.error("[auth/callback] No code and no error in callback URL");
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
