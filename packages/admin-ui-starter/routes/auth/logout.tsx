import { define } from "@/utils.ts";

export const handler = define.handlers({
  GET(_ctx) {
    // Clear auth cookie and redirect to home
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

  POST(_ctx) {
    // Clear auth cookie and redirect to home
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
