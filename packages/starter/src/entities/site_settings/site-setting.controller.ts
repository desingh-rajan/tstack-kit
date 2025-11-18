import { Context } from "hono";
import { SiteSettingService } from "./site-setting.service.ts";
import { ValidationUtil } from "../../shared/utils/validation.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { NotFoundError } from "../../shared/utils/errors.ts";
import {
  CreateSiteSettingSchema,
  UpdateSiteSettingSchema,
} from "./site-setting.dto.ts";

export class SiteSettingController {
  /**
   * GET /site-settings
   * Retrieves all site settings
   * Public endpoint - no authentication required
   */
  static async getAll(c: Context) {
    const siteSettings = await SiteSettingService.getAll();
    return c.json(
      ApiResponse.success(siteSettings, "SiteSettings retrieved successfully"),
      200,
    );
  }

  /**
   * GET /site-settings/:idOrKey
   * Retrieves a single site setting by ID (number) or key (string)
   * Public endpoint - no authentication required
   *
   * @param idOrKey - Can be either:
   *   - Numeric ID: /site-settings/1
   *   - String key: /site-settings/contact_info
   *
   * @example
   * GET /site-settings/1
   * GET /site-settings/hero_section
   */
  static async getByIdOrKey(c: Context) {
    const param = c.req.param("id");

    // Try to parse as ID (number) first
    const id = parseInt(param);
    let siteSetting;

    if (!isNaN(id)) {
      // It's a valid number, get by ID
      siteSetting = await SiteSettingService.getById(id);
    } else {
      // It's a string, get by key
      siteSetting = await SiteSettingService.getByKey(param);
    }

    if (!siteSetting) {
      throw new NotFoundError("SiteSetting not found");
    }

    return c.json(
      ApiResponse.success(siteSetting, "SiteSetting retrieved successfully"),
      200,
    );
  }

  /**
   * POST /site-settings
   * Creates a new site setting
   * Requires authentication and superadmin role
   */
  static async create(c: Context) {
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      CreateSiteSettingSchema,
      body,
    );

    const siteSetting = await SiteSettingService.create(validatedData);

    return c.json(
      ApiResponse.success(siteSetting, "SiteSetting created successfully"),
      201,
    );
  }

  /**
   * PUT /site-settings/:id
   * Updates an existing site setting by ID
   * Requires authentication and superadmin role
   */
  static async update(c: Context) {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      UpdateSiteSettingSchema,
      body,
    );

    const siteSetting = await SiteSettingService.update(id, validatedData);

    if (!siteSetting) {
      throw new NotFoundError("SiteSetting not found");
    }

    return c.json(
      ApiResponse.success(siteSetting, "SiteSetting updated successfully"),
      200,
    );
  }

  /**
   * DELETE /site-settings/:id
   * Deletes a site setting by ID
   * Requires authentication and superadmin role
   */
  static async delete(c: Context) {
    const id = parseInt(c.req.param("id"));
    const success = await SiteSettingService.delete(id);

    if (!success) {
      throw new NotFoundError("SiteSetting not found");
    }

    return c.json(
      ApiResponse.success(null, "SiteSetting deleted successfully"),
      200,
    );
  }

  /**
   * POST /site-settings/:key/reset
   * Resets a system setting to its default value
   * Requires authentication and superadmin role
   *
   * @example POST /site-settings/theme_config/reset
   */
  static async resetToDefault(c: Context) {
    const key = c.req.param("key");
    const siteSetting = await SiteSettingService.resetToDefault(key);

    if (!siteSetting) {
      throw new NotFoundError("System setting not found");
    }

    return c.json(
      ApiResponse.success(
        siteSetting,
        "System setting reset to default successfully",
      ),
      200,
    );
  }

  /**
   * POST /site-settings/reset-all
   * Resets all system settings to their default values
   * Requires authentication and superadmin role
   */
  static async resetAllToDefaults(c: Context) {
    const count = await SiteSettingService.resetAllToDefaults();

    return c.json(
      ApiResponse.success(
        { count },
        `${count} system settings reset to defaults successfully`,
      ),
      200,
    );
  }
}
