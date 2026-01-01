/**
 * Google OAuth redirect handler
 * Redirects to the API's Google OAuth endpoint
 */
import { define } from "@/utils.ts";

const API_BASE_URL = Deno.env.get("API_BASE_URL") || "http://localhost:8000";

export const handler = define.handlers({
  GET(ctx) {
    // Get the redirect URL from query params (where to go after login)
    const redirect = ctx.url.searchParams.get("redirect") || "/";

    // Build the callback URL back to storefront
    const storefrontUrl = Deno.env.get("STOREFRONT_URL") ||
      "http://localhost:5174";
    const callbackUrl = `${storefrontUrl}/api/auth/google/callback?redirect=${
      encodeURIComponent(redirect)
    }`;

    // Redirect to API's Google OAuth endpoint
    const googleAuthUrl = `${API_BASE_URL}/auth/google?redirect=${
      encodeURIComponent(callbackUrl)
    }`;

    return ctx.redirect(googleAuthUrl);
  },
});
