import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { productImages } from "./product-image.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { ProductImageControllerStatic } from "./product-image.controller.ts";

/**
 * Product Image Admin Routes
 *
 * Full CRUD at /ts-admin/product-images
 * Plus: upload, reorder, set primary
 */

const ADMIN_BASE_URL = "/ts-admin/product-images";

// Create ORM adapter
const ormAdapter = new DrizzleAdapter(productImages, {
  db,
  idColumn: "id",
  idType: "uuid",
});

// Create admin adapter
const productImageAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "product-image",
  entityNamePlural: "product-images",
  columns: [
    "id",
    "productId",
    "url",
    "thumbnailUrl",
    "altText",
    "displayOrder",
    "isPrimary",
    "createdAt",
  ],
  searchable: ["altText"],
  sortable: ["id", "productId", "displayOrder", "isPrimary", "createdAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes
const productImageAdminRoutes = new Hono();

// Apply authentication middleware
productImageAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
productImageAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// Custom: Get images for a product
productImageAdminRoutes.get(
  "/ts-admin/products/:productId/images",
  requireAuth,
  ProductImageControllerStatic.getByProductId,
);

// Custom: Upload image for a product
productImageAdminRoutes.post(
  "/ts-admin/products/:productId/images",
  requireAuth,
  ProductImageControllerStatic.uploadImage,
);

// Custom: Reorder images for a product
productImageAdminRoutes.put(
  "/ts-admin/products/:productId/images/reorder",
  requireAuth,
  ProductImageControllerStatic.reorder,
);

// Custom: Set image as primary
productImageAdminRoutes.post(
  `${ADMIN_BASE_URL}/:id/set-primary`,
  ProductImageControllerStatic.setPrimary,
);

// Custom: Delete image (with S3 cleanup)
productImageAdminRoutes.delete(
  `${ADMIN_BASE_URL}/:id`,
  ProductImageControllerStatic.deleteImage,
);

// CRUD routes
productImageAdminRoutes.get(ADMIN_BASE_URL, productImageAdmin.list());
productImageAdminRoutes.get(`${ADMIN_BASE_URL}/new`, productImageAdmin.new());
productImageAdminRoutes.post(ADMIN_BASE_URL, productImageAdmin.create());
productImageAdminRoutes.get(`${ADMIN_BASE_URL}/:id`, productImageAdmin.show());
productImageAdminRoutes.get(
  `${ADMIN_BASE_URL}/:id/edit`,
  productImageAdmin.edit(),
);
productImageAdminRoutes.put(
  `${ADMIN_BASE_URL}/:id`,
  productImageAdmin.update(),
);
productImageAdminRoutes.patch(
  `${ADMIN_BASE_URL}/:id`,
  productImageAdmin.update(),
);

export default productImageAdminRoutes;
