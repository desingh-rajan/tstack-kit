import { Hono } from "hono";
import { paymentController } from "./payment.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Payment Routes (User)
 *
 * All routes require authentication
 *
 * POST /payments/create-order    - Create Razorpay order for checkout
 * POST /payments/verify          - Verify payment after checkout
 * GET  /payments/:orderId/status - Get payment status
 */
const paymentRoutes = new Hono();

// Apply authentication to all routes
paymentRoutes.use("/payments/*", requireAuth);
paymentRoutes.use("/payments", requireAuth);

// Create payment order
paymentRoutes.post(
  "/payments/create-order",
  (c) => paymentController.createOrder(c),
);

// Verify payment
paymentRoutes.post(
  "/payments/verify",
  (c) => paymentController.verifyPayment(c),
);

// Get payment status
paymentRoutes.get(
  "/payments/:orderId/status",
  (c) => paymentController.getStatus(c),
);

export default paymentRoutes;
