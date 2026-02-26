import { define } from "@/utils.ts";

export const handler = define.handlers({
  GET(_ctx) {
    return Response.json({
      status: "ok",
      service: "storefront",
      timestamp: new Date().toISOString(),
    });
  },
});
