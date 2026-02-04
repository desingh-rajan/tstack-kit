/**
 * Facebook OAuth callback handler
 * Receives token from API and sets auth cookie
 */
import { define } from "@/utils.ts";
import { setSessionCookie } from "@/lib/auth.ts";

export const handler = define.handlers({
  GET(ctx) {
    const token = ctx.url.searchParams.get("token");
    const error = ctx.url.searchParams.get("error") ||
      ctx.url.searchParams.get("message");
    const redirect = ctx.url.searchParams.get("redirect") || "/";
    const isNewUser = ctx.url.searchParams.get("new_user") === "true";

    // Handle errors
    if (error) {
      return ctx.redirect(`/auth/login?error=${encodeURIComponent(error)}`);
    }

    // No token received
    if (!token) {
      return ctx.redirect("/auth/login?error=Authentication+failed");
    }

    // Set auth cookie and redirect
    const headers = new Headers();
    setSessionCookie(headers, token);

    // If new user, redirect to complete profile (optional)
    if (isNewUser) {
      headers.set("Location", "/account?welcome=true");
    } else {
      headers.set("Location", redirect);
    }

    return new Response(null, {
      status: 302,
      headers,
    });
  },
});
