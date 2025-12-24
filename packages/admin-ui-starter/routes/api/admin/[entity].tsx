/**
 * Admin API Proxy
 * Proxies requests to backend admin API with authentication
 * Used by client-side islands for dynamic data fetching
 */

import { define } from "@/utils.ts";
import { createApiClient } from "@/lib/api.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const entity = ctx.params.entity;
    const cookies = ctx.req.headers.get("cookie") || "";
    const authToken = cookies.match(/auth_token=([^;]+)/)?.[1];

    if (!authToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const url = new URL(ctx.req.url);
      const pageSize = url.searchParams.get("pageSize") || "100";
      const page = url.searchParams.get("page") || "1";

      const apiClient = createApiClient(authToken);

      // Call the backend admin API
      const result = await apiClient.get<unknown>(
        `/ts-admin/${entity}?page=${page}&pageSize=${pageSize}`,
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`API proxy error for ${entity}:`, error);

      const status = (error as { status?: number })?.status || 500;
      const message = error instanceof Error
        ? error.message
        : "Failed to fetch data";

      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
