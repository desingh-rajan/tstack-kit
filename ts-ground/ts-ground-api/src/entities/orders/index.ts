/**
 * Orders Entity Exports
 *
 * Order management for e-commerce:
 * - Order creation from cart
 * - Order number generation
 * - Address snapshots
 * - Status tracking
 * - Admin management
 */

export * from "./order.model.ts";
export * from "./order-item.model.ts";
export * from "./order.dto.ts";
export * from "./order.service.ts";
export * from "./order.controller.ts";
export { default as orderRoutes } from "./order.route.ts";
export { default as adminOrderRoutes } from "./order.admin.route.ts";
