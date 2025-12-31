/**
 * Logout Handler
 */

import { define } from "@/utils.ts";
import { clearSessionCookie } from "@/lib/auth.ts";

export const handler = define.handlers({
  GET(_ctx) {
    const headers = new Headers();
    clearSessionCookie(headers);
    headers.set("Location", "/");

    return new Response(null, {
      status: 302,
      headers,
    });
  },

  POST(_ctx) {
    const headers = new Headers();
    clearSessionCookie(headers);
    headers.set("Location", "/");

    return new Response(null, {
      status: 302,
      headers,
    });
  },
});
