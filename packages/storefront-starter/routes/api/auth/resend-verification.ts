/**
 * Resend verification email server-side proxy
 * Forwards the request to the backend API with the user's auth token.
 */

import { define } from "@/utils.ts";
import { SSR_API_URL } from "@/lib/api.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const authHeader = ctx.req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      const response = await fetch(`${SSR_API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({ message: "Failed to resend verification email" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
