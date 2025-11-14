/**
 * Admin CRUD Routes for Site Settings
 * Auto-generated admin interface using @tstack/admin
 */

import { Hono } from "hono";
import { HonoAdminAdapter } from "@tstack/admin";
import { DrizzleAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { siteSettings } from "./site-setting.model.ts";

const app = new Hono();

// Configure admin adapter
const adminAdapter = new HonoAdminAdapter({
  ormAdapter: new DrizzleAdapter(siteSettings, { db }),
  entityName: "site_setting",
  entityNamePlural: "site_settings",
  columns: ["id", "key", "category", "value", "isPublic", "description", "createdAt", "updatedAt"],
  searchable: ["key", "category", "description"],
  sortable: ["id", "key", "category", "createdAt", "updatedAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: "/ts-admin/site_settings",
});

// Admin CRUD routes
app.get("/", adminAdapter.list());
app.get("/new", adminAdapter.new());
app.post("/", adminAdapter.create());
app.get("/:id", adminAdapter.show());
app.get("/:id/edit", adminAdapter.edit());
app.put("/:id", adminAdapter.update());
app.patch("/:id", adminAdapter.update());
app.delete("/:id", adminAdapter.destroy());
app.post("/bulk-delete", adminAdapter.bulkDelete());

export default app;
