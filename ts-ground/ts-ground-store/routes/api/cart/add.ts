/**
 * Add to Cart API Route
 * Proxies cart add request to the backend API
 * Supports both authenticated users and guest users
 */

import { define } from "@/utils.ts";

const API_URL = Deno.env.get("API_URL") || "http://localhost:8000";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const body = await ctx.req.json();
      const { productId, quantity, variantId } = body;

      if (!productId || !quantity) {
        return Response.json(
          { success: false, error: "Product ID and quantity are required" },
          { status: 400 },
        );
      }

      // Get auth token and guest cart ID from cookies
      const cookies = ctx.req.headers.get("cookie") || "";
      const authToken = cookies.match(/store_session=([^;]+)/)?.[1];
      const guestCartId = cookies.match(/guest_cart_id=([^;]+)/)?.[1];

      // Build headers for backend API
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      if (guestCartId) {
        headers["x-guest-id"] = guestCartId;
        headers["Cookie"] = `guest_cart_id=${guestCartId}`;
      }

      // Call backend API directly
      const response = await fetch(`${API_URL}/cart/items`, {
        method: "POST",
        headers,
        body: JSON.stringify({ productId, quantity, variantId }),
      });

      const data = await response.json();

      // Forward any set-cookie headers (for new guest cart ID)
      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", "application/json");

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        responseHeaders.set("Set-Cookie", setCookie);
      }

      if (response.ok && data.success) {
        return new Response(
          JSON.stringify({ success: true, data: data.data }),
          {
            status: 200,
            headers: responseHeaders,
          },
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: data.error || data.message || "Failed to add to cart",
          }),
          { status: response.status, headers: responseHeaders },
        );
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      return Response.json(
        { success: false, error: "Internal server error" },
        { status: 500 },
      );
    }
  },
});
