/**
 * Payment Verification API Route
 * Proxies payment verification to the backend
 * Supports both authenticated and guest payment flows
 */

import { define } from "@/utils.ts";
// Per-request API client from middleware (ctx.state.api)
import { getGuestId, getSessionToken } from "@/lib/auth.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const token = getSessionToken(ctx);
    const guestId = getGuestId(ctx);
    const api = ctx.state.api;

    try {
      const body = await ctx.req.json();

      // Determine if this is a guest payment (has email field, no auth token)
      const isGuestPayment = !token && body.email;

      if (!token && !isGuestPayment) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      let response;

      if (isGuestPayment) {
        // Guest payment verification
        if (guestId) {
          api.setGuestId(guestId);
        }
        response = await api.verifyGuestPayment({
          orderId: body.orderId,
          razorpayOrderId: body.razorpayOrderId,
          razorpayPaymentId: body.razorpayPaymentId,
          razorpaySignature: body.razorpaySignature,
          email: body.email,
        });
      } else {
        // Authenticated payment verification
        api.setToken(token!);
        response = await api.verifyPayment({
          orderId: body.orderId,
          razorpayOrderId: body.razorpayOrderId,
          razorpayPaymentId: body.razorpayPaymentId,
          razorpaySignature: body.razorpaySignature,
        });
      }

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
