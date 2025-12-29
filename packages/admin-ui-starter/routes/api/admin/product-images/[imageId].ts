/**
 * Individual Image Operations Proxy
 * Proxies image GET, PUT, DELETE requests to backend API with authentication
 */

import { define } from "@/utils.ts";
import { API_BASE_URL } from "@/lib/api.ts";

export const handler = define.handlers({
  // GET - Get a single image
  async GET(ctx) {
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
      const backendUrl = `${API_BASE_URL}/ts-admin/product-images/${imageId}`;

      const response = await fetch(backendUrl, {
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
      console.error(`Image GET proxy error for ${imageId}:`, error);
      const message = error instanceof Error
        ? error.message
        : "Failed to get image";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // PUT - Update an image
  async PUT(ctx) {
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
      const backendUrl = `${API_BASE_URL}/ts-admin/product-images/${imageId}`;
      const body = await ctx.req.json();

      const response = await fetch(backendUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`Image PUT proxy error for ${imageId}:`, error);
      const message = error instanceof Error
        ? error.message
        : "Failed to update image";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  // DELETE - Delete an image
  async DELETE(ctx) {
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
      const backendUrl = `${API_BASE_URL}/ts-admin/product-images/${imageId}`;

      const response = await fetch(backendUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });

      if (response.status === 204) {
        return new Response(null, { status: 204 });
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error(`Image delete proxy error for ${imageId}:`, error);
      const message = error instanceof Error
        ? error.message
        : "Failed to delete image";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
