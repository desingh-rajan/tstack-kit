import { Hono } from "hono";
import { cartController } from "./cart.controller.ts";
import { optionalAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Cart Routes
 *
 * All routes support both authenticated and guest users.
 * Guest users get a guestId cookie automatically.
 *
 * Public routes (optionalAuth):
 *   GET    /cart           - Get or create cart
 *   POST   /cart/items     - Add item to cart
 *   PUT    /cart/items/:id - Update item quantity
 *   DELETE /cart/items/:id - Remove item from cart
 *   DELETE /cart           - Clear cart
 *   GET    /cart/count     - Get item count for badge
 *   GET    /cart/validate  - Validate stock before checkout
 *
 * Protected routes (requireAuth):
 *   POST   /cart/merge     - Merge guest cart after login
 */
const cartRoutes = new Hono();

// All cart routes use optional auth (guests allowed)
cartRoutes.use("/cart/*", optionalAuth);
cartRoutes.use("/cart", optionalAuth);

// Get or create cart
cartRoutes.get("/cart", (c) => cartController.getCart(c));

// Get cart item count (for header badge)
cartRoutes.get("/cart/count", (c) => cartController.getCartCount(c));

// Validate stock before checkout
cartRoutes.get("/cart/validate", (c) => cartController.validateStock(c));

// Add item to cart
cartRoutes.post("/cart/items", (c) => cartController.addItem(c));

// Update item quantity
cartRoutes.put("/cart/items/:id", (c) => cartController.updateItem(c));

// Remove item from cart
cartRoutes.delete("/cart/items/:id", (c) => cartController.removeItem(c));

// Clear cart
cartRoutes.delete("/cart", (c) => cartController.clearCart(c));

// Merge guest cart (requires auth)
// Note: This uses optionalAuth but checks auth inside controller
// because the merge needs both the guest ID from body and user from auth
cartRoutes.post("/cart/merge", (c) => cartController.mergeCarts(c));

export default cartRoutes;
