import { Hono } from "hono";
import { VariantOptionControllerStatic } from "./variant-option.controller.ts";

/**
 * Variant Option Public Routes
 *
 * Read-only access to variant options:
 * - GET /variant-options - Get all options grouped by type
 * - GET /variant-options/types - Get all unique types
 * - GET /variant-options/type/:type - Get options by type
 */
const variantOptionRoutes = new Hono();

// Get all options grouped by type
variantOptionRoutes.get(
  "/variant-options",
  VariantOptionControllerStatic.getGroupedByType,
);

// Get all unique types
variantOptionRoutes.get(
  "/variant-options/types",
  VariantOptionControllerStatic.getTypes,
);

// Get options by type
variantOptionRoutes.get(
  "/variant-options/type/:type",
  VariantOptionControllerStatic.getByType,
);

export default variantOptionRoutes;
