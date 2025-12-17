import { asc, eq, isNull } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { categories, type CategoryWithChildren } from "./category.model.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import { ensureUniqueSlug, generateSlug } from "../../lib/slug.ts";
import type {
  CategoryResponseDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "./category.dto.ts";
import type { Category } from "./category.model.ts";

/**
 * Category Service
 *
 * Handles category CRUD with hierarchical structure support
 */
export class CategoryService extends BaseService<
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryResponseDTO
> {
  constructor() {
    super(db, categories);
  }

  /**
   * Lifecycle hook: Generate slug before creating
   */
  protected override async beforeCreate(
    data: CreateCategoryDTO,
  ): Promise<CreateCategoryDTO> {
    let slug = data.slug || generateSlug(data.name);

    // Check for existing slugs and make unique if needed
    const existingSlugs = await this.getExistingSlugs();
    slug = ensureUniqueSlug(slug, existingSlugs);

    // Validate parent exists if provided
    if (data.parentId) {
      const parent = await db
        .select()
        .from(categories)
        .where(eq(categories.id, data.parentId))
        .limit(1);

      if (parent.length === 0) {
        throw new BadRequestError("Parent category not found");
      }
    }

    return { ...data, slug };
  }

  /**
   * Lifecycle hook: Validate before updating
   */
  protected override async beforeUpdate(
    id: string,
    data: UpdateCategoryDTO,
  ): Promise<UpdateCategoryDTO> {
    // Validate slug uniqueness
    if (data.slug) {
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, data.slug))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        throw new BadRequestError(
          `Category with slug "${data.slug}" already exists`,
        );
      }
    }

    // If name changed but slug not provided, generate new slug
    if (data.name && !data.slug) {
      const existingSlugs = await this.getExistingSlugs(id);
      data.slug = ensureUniqueSlug(generateSlug(data.name), existingSlugs);
    }

    // Prevent circular reference
    if (data.parentId) {
      if (data.parentId === id) {
        throw new BadRequestError("Category cannot be its own parent");
      }

      // Check if new parent is a descendant of this category
      const isDescendant = await this.isDescendant(data.parentId, id);
      if (isDescendant) {
        throw new BadRequestError(
          "Cannot set a descendant as parent (circular reference)",
        );
      }
    }

    return data;
  }

  /**
   * Override getById to work with UUID (string) IDs
   */
  override async getById(id: string): Promise<CategoryResponseDTO | null> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return result.length === 0 ? null : (result[0] as CategoryResponseDTO);
  }

  /**
   * Override delete to work with UUID (string) IDs
   */
  override async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Override update to work with UUID (string) IDs
   */
  override async update(
    id: string,
    data: UpdateCategoryDTO,
  ): Promise<CategoryResponseDTO | null> {
    const processedData = await this.beforeUpdate(id, data);

    const result = await db
      .update(categories)
      .set({ ...processedData, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    return result.length === 0 ? null : (result[0] as CategoryResponseDTO);
  }

  /**
   * Get category by slug (for public API)
   */
  async getBySlug(slug: string): Promise<CategoryResponseDTO | null> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    return result.length > 0 ? (result[0] as CategoryResponseDTO) : null;
  }

  /**
   * Get all active categories (flat list, for public API)
   */
  async getActiveCategories(): Promise<CategoryResponseDTO[]> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.displayOrder), asc(categories.name));

    return result as CategoryResponseDTO[];
  }

  /**
   * Get categories as hierarchical tree
   */
  async getCategoryTree(activeOnly = true): Promise<CategoryWithChildren[]> {
    let query = db
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder), asc(categories.name));

    if (activeOnly) {
      query = query.where(eq(categories.isActive, true)) as typeof query;
    }

    const allCategories = await query;

    // Build tree structure
    return this.buildTree(allCategories as Category[]);
  }

  /**
   * Get root categories (no parent)
   */
  async getRootCategories(): Promise<CategoryResponseDTO[]> {
    const result = await db
      .select()
      .from(categories)
      .where(isNull(categories.parentId))
      .orderBy(asc(categories.displayOrder), asc(categories.name));

    return result as CategoryResponseDTO[];
  }

  /**
   * Get children of a category
   */
  async getChildren(parentId: string): Promise<CategoryResponseDTO[]> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.parentId, parentId))
      .orderBy(asc(categories.displayOrder), asc(categories.name));

    return result as CategoryResponseDTO[];
  }

  /**
   * Reorder categories (update display_order)
   */
  async reorder(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(categories)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(eq(categories.id, orderedIds[i]));
    }
  }

  /**
   * Build hierarchical tree from flat list
   */
  private buildTree(
    items: Category[],
    parentId: string | null = null,
  ): CategoryWithChildren[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }));
  }

  /**
   * Check if targetId is a descendant of ancestorId
   */
  private async isDescendant(
    targetId: string,
    ancestorId: string,
  ): Promise<boolean> {
    const target = await db
      .select()
      .from(categories)
      .where(eq(categories.id, targetId))
      .limit(1);

    if (target.length === 0 || !target[0].parentId) {
      return false;
    }

    if (target[0].parentId === ancestorId) {
      return true;
    }

    return this.isDescendant(target[0].parentId, ancestorId);
  }

  /**
   * Helper: Get all existing slugs
   */
  private async getExistingSlugs(excludeId?: string): Promise<string[]> {
    const allCategories = await db.select({ slug: categories.slug }).from(
      categories,
    );
    return allCategories
      .filter((c) => !excludeId || c.slug !== excludeId)
      .map((c) => c.slug);
  }
}

export const categoryService = new CategoryService();
