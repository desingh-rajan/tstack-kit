/**
 * Contact form server-side proxy
 * Forwards contact submissions to the backend API,
 * avoiding CORS issues and hiding the API URL from the client.
 */

import { define } from "@/utils.ts";
import { SSR_API_URL } from "@/lib/api.ts";

export const handler = define.handlers({
  async POST(ctx) {
    try {
      const body = await ctx.req.json();

      const response = await fetch(`${SSR_API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(
        JSON.stringify({ message: "Failed to submit contact form" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
});
