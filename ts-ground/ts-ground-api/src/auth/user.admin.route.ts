import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../config/database.ts";
import { users } from "./user.model.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";

// Admin base URL constant
const ADMIN_BASE_URL = "/ts-admin/users";

// Create ORM adapter for user
const ormAdapter = new DrizzleAdapter(users, {
  db,
  idColumn: "id",
  idType: "number",
});

// Create admin adapter with CRUD configuration
const userAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "user",
  entityNamePlural: "users",
  columns: [
    "id",
    "email",
    "username",
    "role",
    "isActive",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["email", "username"],
  sortable: ["id", "email", "username", "role", "createdAt"],
  allowedRoles: ["superadmin"], // Only superadmins can manage users
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes (requires authentication)
const userAdminRoutes = new Hono();

// Apply authentication middleware to all admin routes
userAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
userAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// CRUD routes
userAdminRoutes.get(ADMIN_BASE_URL, userAdmin.list());
userAdminRoutes.get(`${ADMIN_BASE_URL}/new`, userAdmin.new());
userAdminRoutes.post(ADMIN_BASE_URL, userAdmin.create());
userAdminRoutes.get(`${ADMIN_BASE_URL}/:id`, userAdmin.show());
userAdminRoutes.get(`${ADMIN_BASE_URL}/:id/edit`, userAdmin.edit());
userAdminRoutes.put(`${ADMIN_BASE_URL}/:id`, userAdmin.update());
userAdminRoutes.patch(`${ADMIN_BASE_URL}/:id`, userAdmin.update());
userAdminRoutes.delete(`${ADMIN_BASE_URL}/:id`, userAdmin.destroy());
userAdminRoutes.post(`${ADMIN_BASE_URL}/bulk-delete`, userAdmin.bulkDelete());

export default userAdminRoutes;
