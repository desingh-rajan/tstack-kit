/**
 * Clear Session Route
 * Utility endpoint to clear invalid auth tokens
 * Useful for debugging and handling stale sessions
 */

import { define } from "@/utils.ts";

export const handler = define.handlers({
  GET(_ctx) {
    // Clear auth token cookie
    const headers = new Headers();
    headers.set(
      "Set-Cookie",
      "auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
    );
    headers.set("Location", "/");

    return new Response(null, {
      status: 303,
      headers,
    });
  },
});
