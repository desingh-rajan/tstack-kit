import { Hono } from "hono";
import { adminOrderController } from "./order.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { requireAdmin } from "../../shared/middleware/requireRole.ts";

/**
 * Admin Order Routes
 *
 * All routes require admin authentication
 *
 * GET  /ts-admin/orders           - List all orders
 * GET  /ts-admin/orders/:id       - Get order details
 * PUT  /ts-admin/orders/:id/status - Update order status
 */
const adminOrderRoutes = new Hono();

// Apply authentication and admin check to all routes
adminOrderRoutes.use("/ts-admin/orders/*", requireAuth, requireAdmin);
adminOrderRoutes.use("/ts-admin/orders", requireAuth, requireAdmin);

// Admin order routes
adminOrderRoutes.get(
  "/ts-admin/orders",
  (c) => adminOrderController.listOrders(c),
);
adminOrderRoutes.get(
  "/ts-admin/orders/:id",
  (c) => adminOrderController.getOrder(c),
);
adminOrderRoutes.put(
  "/ts-admin/orders/:id/status",
  (c) => adminOrderController.updateOrderStatus(c),
);

export default adminOrderRoutes;
