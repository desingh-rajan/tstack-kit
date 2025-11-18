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
import { SiteSettingController } from "./site-setting.controller.ts";
import { requireSuperadmin } from "../../shared/middleware/requireRole.ts";

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
// Note: Using custom update to enforce system setting validation
app.put(`${ADMIN_BASE_URL}/:id`, SiteSettingController.update);
app.patch(`${ADMIN_BASE_URL}/:id`, SiteSettingController.update);
// Note: Using custom delete to enforce system setting protection
app.delete(`${ADMIN_BASE_URL}/:id`, SiteSettingController.delete);
app.post(`${ADMIN_BASE_URL}/bulk-delete`, adminAdapter.bulkDelete());

// Custom routes for system settings reset functionality
app.post(
  `${ADMIN_BASE_URL}/:key/reset`,
  requireAuth,
  requireSuperadmin,
  SiteSettingController.resetToDefault,
);
app.post(
  `${ADMIN_BASE_URL}/reset-all`,
  requireAuth,
  requireSuperadmin,
  SiteSettingController.resetAllToDefaults,
);

export default app;
