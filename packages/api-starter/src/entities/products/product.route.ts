import { Hono } from "hono";
import { ProductControllerStatic } from "./product.controller.ts";
import { ProductVariantControllerStatic } from "../product_variants/product-variant.controller.ts";

/**
 * Product Public Routes
 *
 * Read-only access to products:
 * - GET /products - List products with filtering and pagination
 * - GET /products/slug/:slug - Get product by slug
 * - GET /products/:productId/variants - Get variants for a product (must be before :id)
 * - GET /products/:id - Get product by ID
 */
const productRoutes = new Hono();

// List products with filtering and pagination
productRoutes.get("/products", ProductControllerStatic.listProducts);

// Get product by slug (must be before :id to avoid conflict)
productRoutes.get("/products/slug/:slug", ProductControllerStatic.getBySlug);

// Get variants for a product (must be before :id to avoid conflict)
productRoutes.get(
  "/products/:productId/variants",
  ProductVariantControllerStatic.getByProductId,
);

// Get product by ID
productRoutes.get("/products/:id", ProductControllerStatic.getById);

export default productRoutes;
