/**
 * Facebook OAuth redirect handler
 * Redirects to the API's Facebook OAuth endpoint
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
    const callbackUrl = `${storefrontUrl}/api/auth/facebook/callback?redirect=${
      encodeURIComponent(redirect)
    }`;

    // Redirect to API's Facebook OAuth endpoint
    const facebookAuthUrl = `${API_BASE_URL}/auth/facebook?redirect=${
      encodeURIComponent(callbackUrl)
    }`;

    return ctx.redirect(facebookAuthUrl);
  },
});
