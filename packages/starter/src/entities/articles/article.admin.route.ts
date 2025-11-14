import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";

/**
 * REFERENCE IMPLEMENTATION: Article Admin Routes
 *
 * This file demonstrates how to create an admin panel for your entities using @tstack/admin.
 * The admin panel provides a full-featured CRUD interface with:
 * - HTML UI (Tailwind CSS + htmx) at /ts-admin/articles
 * - JSON API at /ts-admin/articles (with Accept: application/json header)
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
  baseUrl: "/ts-admin/articles",
});

// Register admin routes (requires authentication)
const articleAdminRoutes = new Hono();

articleAdminRoutes.get("/", articleAdmin.list());
articleAdminRoutes.get("/new", articleAdmin.new());
articleAdminRoutes.post("/", articleAdmin.create());
articleAdminRoutes.get("/:id", articleAdmin.show());
articleAdminRoutes.get("/:id/edit", articleAdmin.edit());
articleAdminRoutes.put("/:id", articleAdmin.update());
articleAdminRoutes.patch("/:id", articleAdmin.update());
articleAdminRoutes.delete("/:id", articleAdmin.destroy());
articleAdminRoutes.post("/bulk-delete", articleAdmin.bulkDelete());

export default articleAdminRoutes;
