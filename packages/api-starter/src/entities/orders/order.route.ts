import { Hono } from "hono";
import { orderController } from "./order.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Order Routes (User)
 *
 * All routes require authentication
 *
 * POST /checkout/validate    - Validate cart before checkout
 * POST /checkout/create      - Create order from cart
 * GET  /orders               - List user's orders
 * GET  /orders/:id           - Get order details
 * POST /orders/:id/cancel    - Cancel order
 */
const orderRoutes = new Hono();

// Apply authentication to all routes
orderRoutes.use("/checkout/*", requireAuth);
orderRoutes.use("/orders/*", requireAuth);
orderRoutes.use("/orders", requireAuth);

// Checkout routes
orderRoutes.post(
  "/checkout/validate",
  (c) => orderController.validateCheckout(c),
);
orderRoutes.post("/checkout/create", (c) => orderController.createOrder(c));

// Order routes
orderRoutes.get("/orders", (c) => orderController.listOrders(c));
orderRoutes.get("/orders/:id", (c) => orderController.getOrder(c));
orderRoutes.post("/orders/:id/cancel", (c) => orderController.cancelOrder(c));

export default orderRoutes;
