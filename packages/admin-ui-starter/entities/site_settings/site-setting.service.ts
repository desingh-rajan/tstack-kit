/**
 * Site Setting Service
 * Extends BaseService for standard CRUD
 */

import { BaseService } from "@/lib/base-service.ts";
import type { SiteSetting } from "./site-setting.types.ts";

export class SiteSettingService extends BaseService<SiteSetting> {
  constructor() {
    super("/ts-admin/site_settings");
  }
}

export const siteSettingService = new SiteSettingService();
