import { Hono } from "hono";
import { webhookController } from "./payment.controller.ts";

/**
 * Webhook Routes
 *
 * Public endpoints for payment provider callbacks
 * No authentication required (signature verification instead)
 *
 * POST /webhooks/razorpay - Razorpay payment webhooks
 */
const webhookRoutes = new Hono();

// Razorpay webhook
webhookRoutes.post(
  "/webhooks/razorpay",
  (c) => webhookController.handleRazorpay(c),
);

export default webhookRoutes;
