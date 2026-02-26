/**
 * robots.txt route
 *
 * Serves a standard robots.txt allowing all crawlers.
 * Links to the dynamically generated sitemap.
 */

import { define } from "@/utils.ts";

const isDeno = typeof Deno !== "undefined";
const APP_URL = isDeno
  ? Deno.env.get("APP_URL") || Deno.env.get("STOREFRONT_URL") ||
    "http://localhost:8001"
  : "http://localhost:8001";

export const handler = define.handlers({
  GET(_ctx) {
    const body = [
      "User-agent: *",
      "Allow: /",
      "",
      "# Disallow internal/API paths",
      "Disallow: /api/",
      "Disallow: /auth/",
      "Disallow: /account/",
      "Disallow: /checkout/",
      "",
      `Sitemap: ${APP_URL}/sitemap.xml`,
    ].join("\n");

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  },
});
