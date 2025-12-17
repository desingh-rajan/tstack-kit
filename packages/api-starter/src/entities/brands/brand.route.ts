import { Hono } from "hono";
import { BrandControllerStatic } from "./brand.controller.ts";

/**
 * Brand Public Routes
 *
 * All routes are public (read-only):
 * - GET /brands - List all active brands
 * - GET /brands/slug/:slug - Get brand by slug
 * - GET /brands/:id - Get brand by ID
 */
const brandRoutes = new Hono();

// List all active brands
brandRoutes.get("/brands", BrandControllerStatic.getActiveBrands);

// Get brand by slug (must be before :id to avoid conflict)
brandRoutes.get("/brands/slug/:slug", BrandControllerStatic.getBySlug);

// Get brand by ID
brandRoutes.get("/brands/:id", BrandControllerStatic.getById);

export default brandRoutes;
