import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * REFERENCE IMPLEMENTATION: Article Admin Routes
 *
 * This file demonstrates how to create an admin panel for your entities using @tstack/admin.
 * The admin panel provides a full-featured CRUD JSON API with:
 * - RESTful JSON API at /ts-admin/articles
 * - Pagination, search, and sorting
 * - Role-based access control
 *
 * When you scaffold a new entity with `tstack scaffold products`,
 * a similar file (product.admin.route.ts) will be automatically generated.
 *
 * TODO for developers:
 * 1. Customize the `columns` array to match your entity's fields
 * 2. Update `searchable` to include fields you want to search
 * 3. Configure `sortable` for columns that should be sortable
 * 4. Adjust `allowedRoles` based on your access control needs
 * 5. See article.admin.test.ts for how to test admin routes
 */

// Admin base URL constant
const ADMIN_BASE_URL = "/ts-admin/articles";

// Create ORM adapter for article
const ormAdapter = new DrizzleAdapter(articles, {
  db,
  idColumn: "id",
  idType: "number",
});

// Create admin adapter with CRUD configuration
const articleAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "article",
  entityNamePlural: "articles",
  columns: [
    "id",
    "title",
    "slug",
    "content",
    "excerpt",
    "isPublished",
    "authorId",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["title", "slug", "content", "excerpt"],
  sortable: ["id", "title", "isPublished", "createdAt", "updatedAt"],
  allowedRoles: ["superadmin", "admin"], // Admins can manage articles
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes (requires authentication)
const articleAdminRoutes = new Hono();

// Apply authentication middleware to all admin routes
articleAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
articleAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// CRUD routes
articleAdminRoutes.get(ADMIN_BASE_URL, articleAdmin.list());
articleAdminRoutes.get(`${ADMIN_BASE_URL}/new`, articleAdmin.new());
articleAdminRoutes.post(ADMIN_BASE_URL, articleAdmin.create());
articleAdminRoutes.get(`${ADMIN_BASE_URL}/:id`, articleAdmin.show());
articleAdminRoutes.get(`${ADMIN_BASE_URL}/:id/edit`, articleAdmin.edit());
articleAdminRoutes.put(`${ADMIN_BASE_URL}/:id`, articleAdmin.update());
articleAdminRoutes.patch(`${ADMIN_BASE_URL}/:id`, articleAdmin.update());
articleAdminRoutes.delete(`${ADMIN_BASE_URL}/:id`, articleAdmin.destroy());
articleAdminRoutes.post(
  `${ADMIN_BASE_URL}/bulk-delete`,
  articleAdmin.bulkDelete(),
);

export default articleAdminRoutes;
