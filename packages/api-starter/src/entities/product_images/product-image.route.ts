import { Hono } from "hono";
import { ProductImageControllerStatic } from "./product-image.controller.ts";

/**
 * Product Image Public Routes
 *
 * Read-only access:
 * - GET /products/:productId/images - Get all images for a product
 */
const productImageRoutes = new Hono();

// Get images for a product
productImageRoutes.get(
  "/products/:productId/images",
  ProductImageControllerStatic.getByProductId,
);

export default productImageRoutes;
