import { Hono } from "hono";
import { CategoryControllerStatic } from "./category.controller.ts";

/**
 * Category Public Routes
 *
 * All routes are public (read-only):
 * - GET /categories - Get category tree (hierarchical)
 * - GET /categories/roots - Get root categories
 * - GET /categories/slug/:slug - Get category by slug
 * - GET /categories/:id - Get category by ID
 * - GET /categories/:id/children - Get children of a category
 */
const categoryRoutes = new Hono();

// Get category tree (hierarchical structure)
categoryRoutes.get("/categories", CategoryControllerStatic.getCategoryTree);

// Get root categories only
categoryRoutes.get(
  "/categories/roots",
  CategoryControllerStatic.getRootCategories,
);

// Get category by slug (must be before :id to avoid conflict)
categoryRoutes.get(
  "/categories/slug/:slug",
  CategoryControllerStatic.getBySlug,
);

// Get category by ID
categoryRoutes.get("/categories/:id", CategoryControllerStatic.getById);

// Get children of a category
categoryRoutes.get(
  "/categories/:id/children",
  CategoryControllerStatic.getChildren,
);

export default categoryRoutes;
