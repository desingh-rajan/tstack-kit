/**
 * Image Upload Proxy
 * Proxies image upload requests to backend API with authentication
 * Used by ImageUploadPane island for file uploads
 */

import { define } from "@/utils.ts";
import { API_BASE_URL } from "@/lib/api.ts";

export const handler = define.handlers({
  // GET - List images for an entity
  async GET(ctx) {
    const { entity, entityId } = ctx.params;
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
        `${API_BASE_URL}/ts-admin/${entity}/${entityId}/images`;

      const response = await fetch(backendUrl, {
        method: "GET",
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
      console.error(`Image list proxy error for ${entity}/${entityId}:`, error);
      const message = error instanceof Error
        ? error.message
        : "Failed to fetch images";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // POST - Upload images for an entity
  async POST(ctx) {
    const { entity, entityId } = ctx.params;
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
        `${API_BASE_URL}/ts-admin/${entity}/${entityId}/images`;

      // Get the content-type with boundary from original request
      const contentType = ctx.req.headers.get("content-type") || "";

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Forward Content-Type with boundary for multipart/form-data
          "Content-Type": contentType,
        },
        body: await ctx.req.arrayBuffer(),
      });

      // Handle the response
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }

      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(
        `Image upload proxy error for ${entity}/${entityId}:`,
        error,
      );
      const message = error instanceof Error
        ? error.message
        : "Failed to upload images";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
