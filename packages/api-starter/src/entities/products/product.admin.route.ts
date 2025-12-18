import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { type Product, products } from "./product.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { ProductControllerStatic } from "./product.controller.ts";

/**
 * Product Admin Routes
 *
 * Full CRUD at /ts-admin/products
 * Plus: soft delete, restore
 */

const ADMIN_BASE_URL = "/ts-admin/products";

// Create ORM adapter (auto-generates slug from name)
const ormAdapter = new DrizzleAdapter(products, {
  db,
  idColumn: "id",
  idType: "uuid",
});

// Create admin adapter
const productAdmin = new HonoAdminAdapter<Product>({
  ormAdapter,
  entityName: "product",
  entityNamePlural: "products",
  columns: [
    "id",
    "name",
    "slug",
    "description",
    "brandId",
    "categoryId",
    "specifications",
    "price",
    "compareAtPrice",
    "sku",
    "stockQuantity",
    "isActive",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["name", "slug", "description", "sku"],
  sortable: [
    "id",
    "name",
    "price",
    "stockQuantity",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes
const productAdminRoutes = new Hono();

// Apply authentication middleware
productAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
productAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// Custom: Soft delete and restore
productAdminRoutes.delete(
  `${ADMIN_BASE_URL}/:id/soft`,
  ProductControllerStatic.softDelete,
);
productAdminRoutes.post(
  `${ADMIN_BASE_URL}/:id/restore`,
  ProductControllerStatic.restore,
);

// CRUD routes
productAdminRoutes.get(ADMIN_BASE_URL, productAdmin.list());
productAdminRoutes.get(`${ADMIN_BASE_URL}/new`, productAdmin.new());
productAdminRoutes.post(ADMIN_BASE_URL, productAdmin.create());
productAdminRoutes.get(`${ADMIN_BASE_URL}/:id`, productAdmin.show());
productAdminRoutes.get(`${ADMIN_BASE_URL}/:id/edit`, productAdmin.edit());
productAdminRoutes.put(`${ADMIN_BASE_URL}/:id`, productAdmin.update());
productAdminRoutes.patch(`${ADMIN_BASE_URL}/:id`, productAdmin.update());
productAdminRoutes.delete(`${ADMIN_BASE_URL}/:id`, productAdmin.destroy());
productAdminRoutes.post(
  `${ADMIN_BASE_URL}/bulk-delete`,
  productAdmin.bulkDelete(),
);

export default productAdminRoutes;
