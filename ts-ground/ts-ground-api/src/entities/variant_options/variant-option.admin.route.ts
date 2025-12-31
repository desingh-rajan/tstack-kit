import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { variantOptions } from "./variant-option.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { VariantOptionControllerStatic } from "./variant-option.controller.ts";

/**
 * Variant Option Admin Routes
 *
 * Full CRUD at /ts-admin/variant-options
 */

const ADMIN_BASE_URL = "/ts-admin/variant-options";

// Create ORM adapter
const ormAdapter = new DrizzleAdapter(variantOptions, {
  db,
  idColumn: "id",
  idType: "uuid",
});

// Create admin adapter
const variantOptionAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "variant-option",
  entityNamePlural: "variant-options",
  columns: [
    "id",
    "name",
    "type",
    "displayOrder",
    "createdAt",
  ],
  searchable: ["name", "type"],
  sortable: ["id", "name", "type", "displayOrder", "createdAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes
const variantOptionAdminRoutes = new Hono();

// Apply authentication middleware
variantOptionAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
variantOptionAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// Custom: Reorder options by type
variantOptionAdminRoutes.put(
  `${ADMIN_BASE_URL}/reorder`,
  VariantOptionControllerStatic.reorder,
);

// CRUD routes
variantOptionAdminRoutes.get(ADMIN_BASE_URL, variantOptionAdmin.list());
variantOptionAdminRoutes.get(`${ADMIN_BASE_URL}/new`, variantOptionAdmin.new());
variantOptionAdminRoutes.post(ADMIN_BASE_URL, variantOptionAdmin.create());
variantOptionAdminRoutes.get(
  `${ADMIN_BASE_URL}/:id`,
  variantOptionAdmin.show(),
);
variantOptionAdminRoutes.get(
  `${ADMIN_BASE_URL}/:id/edit`,
  variantOptionAdmin.edit(),
);
variantOptionAdminRoutes.put(
  `${ADMIN_BASE_URL}/:id`,
  variantOptionAdmin.update(),
);
variantOptionAdminRoutes.patch(
  `${ADMIN_BASE_URL}/:id`,
  variantOptionAdmin.update(),
);
variantOptionAdminRoutes.delete(
  `${ADMIN_BASE_URL}/:id`,
  variantOptionAdmin.destroy(),
);
variantOptionAdminRoutes.post(
  `${ADMIN_BASE_URL}/bulk-delete`,
  variantOptionAdmin.bulkDelete(),
);

export default variantOptionAdminRoutes;
