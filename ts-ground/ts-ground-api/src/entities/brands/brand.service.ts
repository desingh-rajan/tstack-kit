import { eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { brands } from "./brand.model.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import { ensureUniqueSlugSync, generateSlug } from "@tstack/admin";
import type {
  BrandResponseDTO,
  CreateBrandDTO,
  UpdateBrandDTO,
} from "./brand.dto.ts";
import type { Brand } from "./brand.model.ts";

/**
 * Brand Service
 *
 * Handles brand CRUD operations with slug generation
 */
export class BrandService extends BaseService<
  Brand,
  CreateBrandDTO,
  UpdateBrandDTO,
  BrandResponseDTO
> {
  constructor() {
    super(db, brands);
  }

  /**
   * Lifecycle hook: Generate slug before creating
   */
  protected override async beforeCreate(
    data: CreateBrandDTO,
  ): Promise<CreateBrandDTO> {
    let slug = data.slug || generateSlug(data.name);

    // Check for existing slugs and make unique if needed
    const existingSlugs = await this.getExistingSlugs();
    slug = ensureUniqueSlugSync(slug, existingSlugs);

    return { ...data, slug };
  }

  /**
   * Lifecycle hook: Validate slug uniqueness before updating
   */
  protected override async beforeUpdate(
    id: string,
    data: UpdateBrandDTO,
  ): Promise<UpdateBrandDTO> {
    if (data.slug) {
      const existing = await db
        .select()
        .from(brands)
        .where(eq(brands.slug, data.slug))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        throw new BadRequestError(
          `Brand with slug "${data.slug}" already exists`,
        );
      }
    }

    // If name changed but slug not provided, generate new slug
    if (data.name && !data.slug) {
      const existingSlugs = await this.getExistingSlugs(id);
      data.slug = ensureUniqueSlugSync(generateSlug(data.name), existingSlugs);
    }

    return data;
  }

  /**
   * Override getById to work with UUID (string) IDs
   */
  override async getById(id: string): Promise<BrandResponseDTO | null> {
    const result = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1);

    return result.length === 0 ? null : (result[0] as BrandResponseDTO);
  }

  /**
   * Override delete to work with UUID (string) IDs
   */
  override async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(brands)
      .where(eq(brands.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Override update to work with UUID (string) IDs
   */
  override async update(
    id: string,
    data: UpdateBrandDTO,
  ): Promise<BrandResponseDTO | null> {
    const processedData = await this.beforeUpdate(id, data);

    const result = await db
      .update(brands)
      .set({ ...processedData, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning();

    return result.length === 0 ? null : (result[0] as BrandResponseDTO);
  }

  /**
   * Get brand by slug (for public API)
   */
  async getBySlug(slug: string): Promise<BrandResponseDTO | null> {
    const result = await db
      .select()
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1);

    return result.length > 0 ? (result[0] as BrandResponseDTO) : null;
  }

  /**
   * Get all active brands (for public API)
   */
  async getActiveBrands(): Promise<BrandResponseDTO[]> {
    const result = await db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true));

    return result as BrandResponseDTO[];
  }

  /**
   * Helper: Get all existing slugs (excluding a specific ID for updates)
   */
  private async getExistingSlugs(excludeId?: string): Promise<string[]> {
    const allBrands = await db.select({ slug: brands.slug }).from(brands);
    return allBrands
      .filter((b) => !excludeId || b.slug !== excludeId)
      .map((b) => b.slug);
  }
}

export const brandService = new BrandService();
