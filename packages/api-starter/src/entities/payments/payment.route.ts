import { Hono } from "hono";
import { paymentController } from "./payment.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Payment Routes (User)
 *
 * Public routes (no authentication required):
 * - POST /payments/guest/create-order - Create Razorpay order for guest checkout
 * - POST /payments/guest/verify       - Verify payment for guest checkout
 *
 * Protected routes (require authentication):
 * - POST /payments/create-order    - Create Razorpay order for checkout
 * - POST /payments/verify          - Verify payment after checkout
 * - GET  /payments/:orderId/status - Get payment status
 */
const paymentRoutes = new Hono();

// Guest payment routes (no authentication required)
paymentRoutes.post(
  "/payments/guest/create-order",
  (c) => paymentController.createGuestOrder(c),
);
paymentRoutes.post(
  "/payments/guest/verify",
  (c) => paymentController.verifyGuestPayment(c),
);

// Apply authentication to all other routes
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
