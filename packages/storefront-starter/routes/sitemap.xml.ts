/**
 * sitemap.xml route
 *
 * Dynamically generates an XML sitemap from products (and articles
 * if available). Helps search engines discover all public pages.
 */

import { define } from "@/utils.ts";
import { createApiClient } from "@/lib/api.ts";

const isDeno = typeof Deno !== "undefined";
const APP_URL = isDeno
  ? Deno.env.get("APP_URL") || Deno.env.get("STOREFRONT_URL") ||
    "http://localhost:8001"
  : "http://localhost:8001";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

export const handler = define.handlers({
  async GET(_ctx) {
    const api = createApiClient();
    const urls: { loc: string; lastmod?: string; priority: string }[] = [];

    // Static pages
    urls.push({ loc: `${APP_URL}/`, priority: "1.0" });
    urls.push({ loc: `${APP_URL}/products`, priority: "0.8" });

    // Fetch products
    try {
      const result = await api.getProducts({ limit: 1000 });
      if (result.success && result.data?.items) {
        for (const product of result.data.items) {
          const slug = product.slug || product.id;
          urls.push({
            loc: `${APP_URL}/products/${escapeXml(String(slug))}`,
            lastmod: product.updatedAt
              ? formatDate(product.updatedAt)
              : undefined,
            priority: "0.6",
          });
        }
      }
    } catch {
      // API unavailable -- generate sitemap without dynamic data
    }

    // Build XML
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((u) =>
        [
          "  <url>",
          `    <loc>${u.loc}</loc>`,
          u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : "",
          `    <priority>${u.priority}</priority>`,
          "  </url>",
        ].filter(Boolean).join("\n")
      ),
      "</urlset>",
    ].join("\n");

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
});
