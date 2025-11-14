/**
 * Admin CRUD Routes for Site Settings
 * Auto-generated admin interface using @tstack/admin
 */

import { Hono } from "hono";
import { HonoAdminAdapter } from "@tstack/admin";
import { DrizzleAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { siteSettings } from "./site-setting.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

// Admin base URL constant
const ADMIN_BASE_URL = "/ts-admin/site_settings";

const app = new Hono();

// Configure admin adapter
const adminAdapter = new HonoAdminAdapter({
  ormAdapter: new DrizzleAdapter(siteSettings, { db }),
  entityName: "site_setting",
  entityNamePlural: "site_settings",
  columns: [
    "id",
    "key",
    "category",
    "value",
    "isPublic",
    "description",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["key", "category", "description"],
  sortable: ["id", "key", "category", "createdAt", "updatedAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Apply authentication middleware to all admin routes
app.use(`${ADMIN_BASE_URL}/*`, requireAuth);
app.use(ADMIN_BASE_URL, requireAuth);

// CRUD routes
app.get(ADMIN_BASE_URL, adminAdapter.list());
app.get(`${ADMIN_BASE_URL}/new`, adminAdapter.new());
app.post(ADMIN_BASE_URL, adminAdapter.create());
app.get(`${ADMIN_BASE_URL}/:id`, adminAdapter.show());
app.get(`${ADMIN_BASE_URL}/:id/edit`, adminAdapter.edit());
app.put(`${ADMIN_BASE_URL}/:id`, adminAdapter.update());
app.patch(`${ADMIN_BASE_URL}/:id`, adminAdapter.update());
app.delete(`${ADMIN_BASE_URL}/:id`, adminAdapter.destroy());
app.post(`${ADMIN_BASE_URL}/bulk-delete`, adminAdapter.bulkDelete());

export default app;
