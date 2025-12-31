import { define } from "@/utils.ts";

export const handler = define.handlers({
  POST(_ctx) {
    // Clear the auth token cookie
    return new Response("", {
      status: 303,
      headers: {
        Location: "/auth/login",
        "Set-Cookie":
          "auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      },
    });
  },
});
