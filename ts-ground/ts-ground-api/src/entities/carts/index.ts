/**
 * Cart Entity Exports
 *
 * Main cart functionality for e-commerce:
 * - Guest and authenticated user carts
 * - Cart item management with stock validation
 * - Price snapshots for change detection
 * - Cart merging on login
 */

export * from "./cart.model.ts";
export * from "./cart-item.model.ts";
export * from "./cart.dto.ts";
export * from "./cart.service.ts";
export * from "./cart.controller.ts";
export { default as cartRoutes } from "./cart.route.ts";
