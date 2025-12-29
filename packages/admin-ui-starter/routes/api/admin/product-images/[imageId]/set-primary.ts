/**
 * Set Image as Primary Proxy
 * Proxies set-primary requests to backend API with authentication
 */

import { define } from "@/utils.ts";
import { API_BASE_URL } from "@/lib/api.ts";

export const handler = define.handlers({
  // POST - Set image as primary
  async POST(ctx) {
    const { imageId } = ctx.params;
    const cookies = ctx.req.headers.get("cookie") || "";
    const authToken = cookies.match(/auth_token=([^;]+)/)?.[1];

    if (!authToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const backendUrl =
        `${API_BASE_URL}/ts-admin/product-images/${imageId}/set-primary`;

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`Set primary proxy error for ${imageId}:`, error);
      const message = error instanceof Error
        ? error.message
        : "Failed to set primary image";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
