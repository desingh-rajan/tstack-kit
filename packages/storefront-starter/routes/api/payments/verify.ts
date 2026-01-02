/**
 * Payment Verification API Route
 * Proxies payment verification to the backend
 */

import { define } from "@/utils.ts";
import { api } from "@/lib/api.ts";
import { getSessionToken } from "@/lib/auth.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const token = getSessionToken(ctx);
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      const body = await ctx.req.json();
      api.setToken(token);

      const response = await api.verifyPayment({
        orderId: body.orderId,
        razorpayOrderId: body.razorpayOrderId,
        razorpayPaymentId: body.razorpayPaymentId,
        razorpaySignature: body.razorpaySignature,
      });

      return new Response(JSON.stringify(response), {
        status: response.success ? 200 : 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Verification failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
