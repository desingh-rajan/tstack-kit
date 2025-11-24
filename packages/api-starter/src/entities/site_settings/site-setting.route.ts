import { Hono } from "hono";
import { SiteSettingController } from "./site-setting.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { requireSuperadmin } from "../../shared/middleware/requireRole.ts";
import { BaseRouteFactory } from "../../shared/routes/base-route.factory.ts";
import {
  CreateSiteSettingSchema,
  UpdateSiteSettingSchema,
} from "./site-setting.dto.ts";

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

const siteSettingRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/site-settings",
  controller: {
    getAll: SiteSettingController.getAll,
    getById: SiteSettingController.getByIdOrKey,
    create: SiteSettingController.create,
    update: SiteSettingController.update,
    delete: SiteSettingController.delete,
  },
  schemas: {
    create: CreateSiteSettingSchema,
    update: UpdateSiteSettingSchema,
  },
  publicRoutes: ["getAll", "getById"],
  middleware: {
    auth: requireAuth,
    role: requireSuperadmin,
  },
});

// Custom routes for reset functionality
const customMiddleware = [requireAuth, requireSuperadmin];

siteSettingRoutes.post(
  "/site-settings/:key/reset",
  ...customMiddleware,
  SiteSettingController.resetToDefault,
);

siteSettingRoutes.post(
  "/site-settings/reset-all",
  ...customMiddleware,
  SiteSettingController.resetAllToDefaults,
);

export default siteSettingRoutes;
