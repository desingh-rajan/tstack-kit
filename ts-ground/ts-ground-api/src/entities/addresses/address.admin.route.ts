import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { type Address, addresses } from "./address.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Address Admin Routes
 *
 * Full CRUD at /ts-admin/addresses
 * Admin can view/manage all users' addresses
 */

const ADMIN_BASE_URL = "/ts-admin/addresses";

// Create ORM adapter
const ormAdapter = new DrizzleAdapter(addresses, {
  db,
  idColumn: "id",
  idType: "uuid",
});

// Create admin adapter
const addressAdmin = new HonoAdminAdapter<Address>({
  ormAdapter,
  entityName: "address",
  entityNamePlural: "addresses",
  columns: [
    "id",
    "userId",
    "label",
    "fullName",
    "phone",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
    "country",
    "type",
    "isDefault",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["fullName", "phone", "city", "state", "postalCode"],
  sortable: [
    "id",
    "userId",
    "fullName",
    "city",
    "state",
    "type",
    "isDefault",
    "createdAt",
  ],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes
const addressAdminRoutes = new Hono();

// Apply authentication middleware
addressAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
addressAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// CRUD routes
addressAdminRoutes.get(ADMIN_BASE_URL, addressAdmin.list());
addressAdminRoutes.get(`${ADMIN_BASE_URL}/new`, addressAdmin.new());
addressAdminRoutes.post(ADMIN_BASE_URL, addressAdmin.create());
addressAdminRoutes.get(`${ADMIN_BASE_URL}/:id`, addressAdmin.show());
addressAdminRoutes.get(`${ADMIN_BASE_URL}/:id/edit`, addressAdmin.edit());
addressAdminRoutes.put(`${ADMIN_BASE_URL}/:id`, addressAdmin.update());
addressAdminRoutes.patch(`${ADMIN_BASE_URL}/:id`, addressAdmin.update());
addressAdminRoutes.delete(`${ADMIN_BASE_URL}/:id`, addressAdmin.destroy());
addressAdminRoutes.post(
  `${ADMIN_BASE_URL}/bulk-delete`,
  addressAdmin.bulkDelete(),
);

export default addressAdminRoutes;
