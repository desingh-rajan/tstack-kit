import { eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { siteSettings } from "./site-setting.model.ts";
import type {
  CreateSiteSettingDTO,
  SiteSettingResponseDTO,
  UpdateSiteSettingDTO,
} from "./site-setting.dto.ts";
import {
  CATEGORY_MAP,
  DEFAULT_SETTINGS,
  PUBLIC_SETTINGS,
  SITE_SETTING_SCHEMAS,
  SYSTEM_SETTING_KEYS,
  type SystemSettingKey,
} from "./schemas/index.ts";
import { ValidationError } from "../../shared/utils/errors.ts";

export class SiteSettingService {
  // Get all siteSettings
  static async getAll(): Promise<SiteSettingResponseDTO[]> {
    const result = await db.select().from(siteSettings);
    return result as SiteSettingResponseDTO[];
  }

  // Get siteSetting by ID
  static async getById(id: number): Promise<SiteSettingResponseDTO | null> {
    const result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as SiteSettingResponseDTO;
  }

  // Get siteSetting by key (with auto-seeding for system settings)
  static async getByKey(key: string): Promise<SiteSettingResponseDTO | null> {
    // Try to get from DB first
    let result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);

    // Found in DB, return it
    if (result.length > 0) {
      return result[0] as SiteSettingResponseDTO;
    }

    // Not found - check if it's a system setting
    if (key in SITE_SETTING_SCHEMAS) {
      console.log(
        `[AUTO-SEED] System setting '${key}' missing from DB, creating with defaults...`,
      );

      try {
        // Auto-create with defaults
        const newSetting = await this.createSystemSetting(
          key as SystemSettingKey,
        );
        return newSetting;
      } catch (error) {
        // Race condition: Another process may have created it
        // Query again
        result = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, key))
          .limit(1);

        if (result.length > 0) {
          return result[0] as SiteSettingResponseDTO;
        }

        // Something else went wrong
        throw error;
      }
    }

    // Not a system setting and not found
    return null;
  }

  // Create new siteSetting
  static async create(
    data: CreateSiteSettingDTO,
  ): Promise<SiteSettingResponseDTO> {
    // Validate value against schema if provided
    if (data.isSystem && data.key in SITE_SETTING_SCHEMAS) {
      const schema = SITE_SETTING_SCHEMAS[data.key as SystemSettingKey];
      const result = schema.safeParse(data.value);

      if (!result.success) {
        throw new ValidationError(
          "Invalid value for system setting",
          result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        );
      }
    } else if (data.valueSchema && data.value) {
      // Validate custom setting against simple schema
      // Custom schema validation only works for object values
      if (
        typeof data.value === "object" && data.value !== null &&
        !Array.isArray(data.value)
      ) {
        this.validateCustomSchema(
          data.value as Record<string, unknown>,
          data.valueSchema,
        );
      }
    }

    const newRecord = await db
      .insert(siteSettings)
      .values({
        ...data,
        isSystem: data.isSystem ?? false,
        isPublic: data.isPublic ?? false,
      })
      .returning();

    return newRecord[0] as SiteSettingResponseDTO;
  }

  // Update siteSetting
  static async update(
    id: number,
    data: UpdateSiteSettingDTO,
  ): Promise<SiteSettingResponseDTO | null> {
    // Get existing setting to check if it's a system setting
    const existing = await this.getById(id);
    if (!existing) {
      return null;
    }

    // If updating value, validate against schema
    if (
      data.value && existing.isSystem && existing.key in SITE_SETTING_SCHEMAS
    ) {
      const schema = SITE_SETTING_SCHEMAS[existing.key as SystemSettingKey];
      const result = schema.safeParse(data.value);

      if (!result.success) {
        throw new ValidationError(
          "Invalid value for system setting",
          result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        );
      }
    } else if (data.value && existing.valueSchema) {
      // Validate custom setting
      // Custom schema validation only works for object values
      if (
        typeof data.value === "object" && data.value !== null &&
        !Array.isArray(data.value)
      ) {
        this.validateCustomSchema(
          data.value as Record<string, unknown>,
          existing.valueSchema,
        );
      }
    }

    const updated = await db
      .update(siteSettings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, id))
      .returning();

    if (updated.length === 0) {
      return null;
    }

    return updated[0] as SiteSettingResponseDTO;
  }

  // Delete siteSetting (protect system settings)
  static async delete(id: number): Promise<boolean> {
    const setting = await this.getById(id);

    if (!setting) {
      return false;
    }

    // Prevent deletion of system settings
    if (setting.isSystem) {
      throw new ValidationError(
        "Cannot delete system setting. Use 'reset' to restore default values instead.",
      );
    }

    const deleted = await db
      .delete(siteSettings)
      .where(eq(siteSettings.id, id))
      .returning();

    return deleted.length > 0;
  }

  // Reset system setting to default value
  static async resetToDefault(
    key: string,
  ): Promise<SiteSettingResponseDTO | null> {
    if (!(key in SITE_SETTING_SCHEMAS)) {
      throw new ValidationError("Not a system setting, cannot reset");
    }

    const defaultValue = DEFAULT_SETTINGS[key as SystemSettingKey];

    // Update existing or create if missing
    const existing = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);

    if (existing.length > 0) {
      // Update with default
      const updated = await db
        .update(siteSettings)
        .set({
          value: defaultValue,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.key, key))
        .returning();

      return updated[0] as SiteSettingResponseDTO;
    } else {
      // Create with default
      return await this.createSystemSetting(key as SystemSettingKey);
    }
  }

  // Reset all system settings to defaults
  static async resetAllToDefaults(): Promise<number> {
    let count = 0;

    for (const key of SYSTEM_SETTING_KEYS) {
      await this.resetToDefault(key);
      count++;
    }

    return count;
  }

  // Helper: Create system setting with defaults
  private static async createSystemSetting(
    key: SystemSettingKey,
  ): Promise<SiteSettingResponseDTO> {
    const defaultValue = DEFAULT_SETTINGS[key];
    const category = CATEGORY_MAP[key];
    const isPublic = PUBLIC_SETTINGS.includes(key);

    const newSetting = await db
      .insert(siteSettings)
      .values({
        key: key,
        category: category,
        value: defaultValue,
        isSystem: true,
        isPublic: isPublic,
        description: `${key.replace(/_/g, " ")} configuration`,
      })
      .returning();

    console.log(`[AUTO-SEED] ✅ Created system setting: ${key}`);
    return newSetting[0] as SiteSettingResponseDTO;
  }

  // Helper: Validate custom setting against simple schema
  private static validateCustomSchema(
    value: Record<string, unknown>,
    schema: Record<string, string>,
  ): void {
    for (const [field, expectedType] of Object.entries(schema)) {
      const actualType = typeof value[field];

      if (actualType !== expectedType) {
        throw new ValidationError(
          `Field '${field}' must be of type '${expectedType}', got '${actualType}'`,
        );
      }
    }
  }
}
