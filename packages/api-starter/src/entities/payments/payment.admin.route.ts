import { Hono } from "hono";
import { adminPaymentController } from "./payment.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { requireAdmin } from "../../shared/middleware/requireRole.ts";

/**
 * Admin Payment Routes
 *
 * All routes require admin authentication
 *
 * POST /ts-admin/payments/:orderId/refund - Process refund
 */
const adminPaymentRoutes = new Hono();

// Apply authentication and admin role to all routes
adminPaymentRoutes.use("/ts-admin/payments/*", requireAuth);
adminPaymentRoutes.use("/ts-admin/payments/*", requireAdmin);

// Process refund
adminPaymentRoutes.post(
  "/ts-admin/payments/:orderId/refund",
  (c) => adminPaymentController.refund(c),
);

// Record manual refund (for COD/UPI orders)
adminPaymentRoutes.post(
  "/ts-admin/payments/:orderId/manual-refund",
  (c) => adminPaymentController.manualRefund(c),
);

export default adminPaymentRoutes;
