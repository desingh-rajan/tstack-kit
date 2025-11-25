import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  POST(_req) {
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
};
