import { Hono } from "hono";
import { ProductVariantControllerStatic } from "./product-variant.controller.ts";

/**
 * Product Variant Public Routes
 *
 * Read-only access:
 * - GET /variants/sku/:sku - Get variant by SKU
 *
 * Note: GET /products/:productId/variants is registered in product.route.ts
 * to ensure proper route ordering (before /products/:id)
 */
const productVariantRoutes = new Hono();

// Get variant by SKU
productVariantRoutes.get(
  "/variants/sku/:sku",
  ProductVariantControllerStatic.getBySku,
);

export default productVariantRoutes;
