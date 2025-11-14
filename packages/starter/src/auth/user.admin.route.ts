import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../config/database.ts";
import { users } from "./user.model.ts";

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
  baseUrl: "/ts-admin/users",
});

// Register admin routes (requires authentication)
const userAdminRoutes = new Hono();

userAdminRoutes.get("/", userAdmin.list());
userAdminRoutes.get("/new", userAdmin.new());
userAdminRoutes.post("/", userAdmin.create());
userAdminRoutes.get("/:id", userAdmin.show());
userAdminRoutes.get("/:id/edit", userAdmin.edit());
userAdminRoutes.put("/:id", userAdmin.update());
userAdminRoutes.patch("/:id", userAdmin.update());
userAdminRoutes.delete("/:id", userAdmin.destroy());
userAdminRoutes.post("/bulk-delete", userAdmin.bulkDelete());

export default userAdminRoutes;
