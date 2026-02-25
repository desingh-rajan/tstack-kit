import { Hono } from "hono";
import { orderController } from "./order.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Order Routes (User)
 *
 * Authentication:
 * - /checkout/guest/* - No auth required (guest checkout)
 * - /orders/track     - No auth required (order tracking)
 * - All other routes  - Require authentication
 *
 * POST /checkout/validate       - Validate cart before checkout (authenticated)
 * POST /checkout/create         - Create order from cart (authenticated)
 * POST /checkout/guest/validate - Validate guest checkout
 * POST /checkout/guest/create   - Create guest order
 * GET  /checkout/guest/order/:id - Get guest order for payment
 * GET  /orders                  - List user's orders (authenticated)
 * GET  /orders/:id              - Get order details (authenticated)
 * POST /orders/:id/cancel       - Cancel order (authenticated)
 * POST /orders/track            - Track order by number + email (public)
 */
const orderRoutes = new Hono();

// Guest checkout routes (no authentication required)
orderRoutes.post(
  "/checkout/guest/validate",
  (c) => orderController.validateGuestCheckout(c),
);
orderRoutes.post(
  "/checkout/guest/create",
  (c) => orderController.createGuestOrder(c),
);

// Order tracking (public - no authentication required)
orderRoutes.post("/orders/track", (c) => orderController.trackOrder(c));

// Guest order for payment (public - requires email query param for verification)
orderRoutes.get(
  "/checkout/guest/order/:id",
  (c) => orderController.getGuestOrderForPayment(c),
);

// Apply authentication to authenticated-only routes
orderRoutes.use("/checkout/validate", requireAuth);
orderRoutes.use("/checkout/create", requireAuth);

// Protected checkout routes (authenticated users)
orderRoutes.post(
  "/checkout/validate",
  (c) => orderController.validateCheckout(c),
);
orderRoutes.post("/checkout/create", (c) => orderController.createOrder(c));

// Protected order routes (authenticated users)
orderRoutes.use("/orders", requireAuth);
orderRoutes.use("/orders/*", requireAuth);
orderRoutes.get("/orders", (c) => orderController.listOrders(c));
orderRoutes.get("/orders/:id", (c) => orderController.getOrder(c));
orderRoutes.post("/orders/:id/cancel", (c) => orderController.cancelOrder(c));

export default orderRoutes;
