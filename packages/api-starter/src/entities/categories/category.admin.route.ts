import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { categories } from "./category.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { CategoryControllerStatic } from "./category.controller.ts";

/**
 * Category Admin Routes
 *
 * Full CRUD at /ts-admin/categories
 * Plus: reorder endpoint for drag-and-drop ordering
 */

const ADMIN_BASE_URL = "/ts-admin/categories";

// Create ORM adapter
const ormAdapter = new DrizzleAdapter(categories, {
  db,
  idColumn: "id",
  idType: "uuid",
});

// Create admin adapter
const categoryAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "category",
  entityNamePlural: "categories",
  columns: [
    "id",
    "name",
    "slug",
    "description",
    "parentId",
    "icon",
    "displayOrder",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["name", "slug", "description"],
  sortable: [
    "id",
    "name",
    "displayOrder",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes
const categoryAdminRoutes = new Hono();

// Apply authentication middleware
categoryAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
categoryAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// Custom: Reorder categories
categoryAdminRoutes.put(
  `${ADMIN_BASE_URL}/reorder`,
  CategoryControllerStatic.reorder,
);

// CRUD routes
categoryAdminRoutes.get(ADMIN_BASE_URL, categoryAdmin.list());
categoryAdminRoutes.get(`${ADMIN_BASE_URL}/new`, categoryAdmin.new());
categoryAdminRoutes.post(ADMIN_BASE_URL, categoryAdmin.create());
categoryAdminRoutes.get(`${ADMIN_BASE_URL}/:id`, categoryAdmin.show());
categoryAdminRoutes.get(`${ADMIN_BASE_URL}/:id/edit`, categoryAdmin.edit());
categoryAdminRoutes.put(`${ADMIN_BASE_URL}/:id`, categoryAdmin.update());
categoryAdminRoutes.patch(`${ADMIN_BASE_URL}/:id`, categoryAdmin.update());
categoryAdminRoutes.delete(`${ADMIN_BASE_URL}/:id`, categoryAdmin.destroy());
categoryAdminRoutes.post(
  `${ADMIN_BASE_URL}/bulk-delete`,
  categoryAdmin.bulkDelete(),
);

export default categoryAdminRoutes;
