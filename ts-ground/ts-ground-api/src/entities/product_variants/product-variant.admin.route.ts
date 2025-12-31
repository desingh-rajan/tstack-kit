import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { productVariants } from "./product-variant.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { ProductVariantControllerStatic } from "./product-variant.controller.ts";

/**
 * Product Variant Admin Routes
 *
 * Full CRUD at /ts-admin/product-variants
 * Plus: bulk create, stock management
 */

const ADMIN_BASE_URL = "/ts-admin/product-variants";

// Create ORM adapter
const ormAdapter = new DrizzleAdapter(productVariants, {
  db,
  idColumn: "id",
  idType: "uuid",
});

// Create admin adapter
const productVariantAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "product-variant",
  entityNamePlural: "product-variants",
  columns: [
    "id",
    "productId",
    "sku",
    "price",
    "compareAtPrice",
    "stockQuantity",
    "options",
    "imageId",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["sku"],
  sortable: [
    "id",
    "productId",
    "sku",
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
const productVariantAdminRoutes = new Hono();

// Apply authentication middleware
productVariantAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
productVariantAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// Custom: Bulk create variants
productVariantAdminRoutes.post(
  `${ADMIN_BASE_URL}/bulk`,
  ProductVariantControllerStatic.bulkCreate,
);

// Custom: Update stock quantity
productVariantAdminRoutes.put(
  `${ADMIN_BASE_URL}/:id/stock`,
  ProductVariantControllerStatic.updateStock,
);

// Custom: Adjust stock quantity
productVariantAdminRoutes.post(
  `${ADMIN_BASE_URL}/:id/stock/adjust`,
  ProductVariantControllerStatic.adjustStock,
);

// CRUD routes
productVariantAdminRoutes.get(ADMIN_BASE_URL, productVariantAdmin.list());
productVariantAdminRoutes.get(
  `${ADMIN_BASE_URL}/new`,
  productVariantAdmin.new(),
);
productVariantAdminRoutes.post(ADMIN_BASE_URL, productVariantAdmin.create());
productVariantAdminRoutes.get(
  `${ADMIN_BASE_URL}/:id`,
  productVariantAdmin.show(),
);
productVariantAdminRoutes.get(
  `${ADMIN_BASE_URL}/:id/edit`,
  productVariantAdmin.edit(),
);
productVariantAdminRoutes.put(
  `${ADMIN_BASE_URL}/:id`,
  productVariantAdmin.update(),
);
productVariantAdminRoutes.patch(
  `${ADMIN_BASE_URL}/:id`,
  productVariantAdmin.update(),
);
productVariantAdminRoutes.delete(
  `${ADMIN_BASE_URL}/:id`,
  productVariantAdmin.destroy(),
);
productVariantAdminRoutes.post(
  `${ADMIN_BASE_URL}/bulk-delete`,
  productVariantAdmin.bulkDelete(),
);

export default productVariantAdminRoutes;
