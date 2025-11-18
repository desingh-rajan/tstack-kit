import { Hono } from "hono";
import { SiteSettingController } from "./site-setting.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { requireSuperadmin } from "../../shared/middleware/requireRole.ts";

const siteSettingRoutes = new Hono();

/**
 * Site Settings Routes
 *
 * PUBLIC ROUTES (no auth required):
 *   GET /site-settings           - List all settings (frontend can access)
 *   GET /site-settings/:idOrKey  - Get single setting by ID or key (frontend can access)
 *
 * ADMIN ROUTES (superadmin only):
 *   POST /site-settings             - Create new setting
 *   PUT /site-settings/:id          - Update setting
 *   DELETE /site-settings/:id       - Delete setting
 *   POST /site-settings/:key/reset  - Reset system setting to default
 *   POST /site-settings/reset-all   - Reset all system settings to defaults
 */

// PUBLIC ROUTES - Frontend can access to fetch site configuration
siteSettingRoutes.get("/site-settings", SiteSettingController.getAll);
siteSettingRoutes.get("/site-settings/:id", SiteSettingController.getByIdOrKey);

// ADMIN ROUTES - Superadmin only
siteSettingRoutes.post(
  "/site-settings",
  requireAuth,
  requireSuperadmin,
  SiteSettingController.create,
);
siteSettingRoutes.put(
  "/site-settings/:id",
  requireAuth,
  requireSuperadmin,
  SiteSettingController.update,
);
siteSettingRoutes.delete(
  "/site-settings/:id",
  requireAuth,
  requireSuperadmin,
  SiteSettingController.delete,
);
siteSettingRoutes.post(
  "/site-settings/:key/reset",
  requireAuth,
  requireSuperadmin,
  SiteSettingController.resetToDefault,
);
siteSettingRoutes.post(
  "/site-settings/reset-all",
  requireAuth,
  requireSuperadmin,
  SiteSettingController.resetAllToDefaults,
);

export default siteSettingRoutes;
