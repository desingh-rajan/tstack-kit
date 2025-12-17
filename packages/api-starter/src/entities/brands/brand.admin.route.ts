import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { brands } from "./brand.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Brand Admin Routes
 *
 * Full CRUD at /ts-admin/brands
 * Requires authentication with admin role
 */

const ADMIN_BASE_URL = "/ts-admin/brands";

// Create ORM adapter for brands
const ormAdapter = new DrizzleAdapter(brands, {
  db,
  idColumn: "id",
  idType: "uuid",
});

// Create admin adapter with CRUD configuration
const brandAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "brand",
  entityNamePlural: "brands",
  columns: [
    "id",
    "name",
    "slug",
    "logoUrl",
    "websiteUrl",
    "description",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["name", "slug", "description"],
  sortable: ["id", "name", "isActive", "createdAt", "updatedAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes
const brandAdminRoutes = new Hono();

// Apply authentication middleware
brandAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
brandAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// CRUD routes
brandAdminRoutes.get(ADMIN_BASE_URL, brandAdmin.list());
brandAdminRoutes.get(`${ADMIN_BASE_URL}/new`, brandAdmin.new());
brandAdminRoutes.post(ADMIN_BASE_URL, brandAdmin.create());
brandAdminRoutes.get(`${ADMIN_BASE_URL}/:id`, brandAdmin.show());
brandAdminRoutes.get(`${ADMIN_BASE_URL}/:id/edit`, brandAdmin.edit());
brandAdminRoutes.put(`${ADMIN_BASE_URL}/:id`, brandAdmin.update());
brandAdminRoutes.patch(`${ADMIN_BASE_URL}/:id`, brandAdmin.update());
brandAdminRoutes.delete(`${ADMIN_BASE_URL}/:id`, brandAdmin.destroy());
brandAdminRoutes.post(`${ADMIN_BASE_URL}/bulk-delete`, brandAdmin.bulkDelete());

export default brandAdminRoutes;
