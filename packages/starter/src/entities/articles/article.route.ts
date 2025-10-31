import { Hono } from "hono";
import { ArticleController } from "./article.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Article Routes - Reference Example
 *
 * Demonstrates mixed authentication patterns:
 *
 * PUBLIC ROUTES (no auth required):
 *   GET /articles           - List published articles (anyone can view)
 *   GET /articles/:id       - View single article (anyone can read)
 *
 * PROTECTED ROUTES (requireAuth middleware):
 *   POST /articles          - Create article (logged-in users only)
 *   PUT /articles/:id       - Update article (author/admin only - checked in controller)
 *   DELETE /articles/:id    - Delete article (author/admin only - checked in controller)
 *
 * The requireAuth middleware:
 * - Validates JWT token from Authorization header
 * - Sets c.get('user') with user info (id, email)
 * - Returns 401 if token is missing/invalid
 *
 * Usage patterns:
 * 1. Public routes: No middleware, anyone can access
 * 2. Auth required: Add requireAuth before controller
 * 3. Authorization check: Use c.get('user') in controller to check permissions
 */

const articleRoutes = new Hono();

// PUBLIC ROUTES - No authentication required
articleRoutes.get("/articles", ArticleController.getAll);
articleRoutes.get("/articles/:id", ArticleController.getById);

// PROTECTED ROUTES - Require authentication (Bearer token)
articleRoutes.post("/articles", requireAuth, ArticleController.create);
articleRoutes.put("/articles/:id", requireAuth, ArticleController.update);
articleRoutes.delete("/articles/:id", requireAuth, ArticleController.delete);

export default articleRoutes;
