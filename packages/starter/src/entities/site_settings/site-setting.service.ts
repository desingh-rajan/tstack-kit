import { eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { siteSettings } from "./site-setting.model.ts";
import type {
  CreateSiteSettingDTO,
  SiteSettingResponseDTO,
  UpdateSiteSettingDTO,
} from "./site-setting.dto.ts";

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

  // Get siteSetting by key
  static async getByKey(key: string): Promise<SiteSettingResponseDTO | null> {
    const result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as SiteSettingResponseDTO;
  }

  // Create new siteSetting
  static async create(
    data: CreateSiteSettingDTO,
  ): Promise<SiteSettingResponseDTO> {
    const newRecord = await db
      .insert(siteSettings)
      .values({
        ...data,
        isPublic: data.isPublic ?? false, // Default to false if not provided
        // createdAt and updatedAt are auto-set by database defaults
      })
      .returning();

    return newRecord[0] as SiteSettingResponseDTO;
  }

  // Update siteSetting
  static async update(
    id: number,
    data: UpdateSiteSettingDTO,
  ): Promise<SiteSettingResponseDTO | null> {
    const updated = await db
      .update(siteSettings)
      .set({
        ...data,
        updatedAt: new Date(), // Update timestamp
      })
      .where(eq(siteSettings.id, id))
      .returning();

    if (updated.length === 0) {
      return null;
    }

    return updated[0] as SiteSettingResponseDTO;
  }

  // Delete siteSetting
  static async delete(id: number): Promise<boolean> {
    const deleted = await db
      .delete(siteSettings)
      .where(eq(siteSettings.id, id))
      .returning();

    return deleted.length > 0;
  }
}
