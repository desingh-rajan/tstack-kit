import { and, asc, eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { variantOptions } from "./variant-option.model.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import type {
  CreateVariantOptionDTO,
  UpdateVariantOptionDTO,
  VariantOptionResponseDTO,
  VariantOptionsByType,
} from "./variant-option.dto.ts";
import type { VariantOption } from "./variant-option.model.ts";

/**
 * Variant Option Service
 *
 * Handles CRUD for global variant options (size, color, etc.)
 */
export class VariantOptionService extends BaseService<
  VariantOption,
  CreateVariantOptionDTO,
  UpdateVariantOptionDTO,
  VariantOptionResponseDTO
> {
  constructor() {
    super(db, variantOptions);
  }

  /**
   * Lifecycle hook: Validate uniqueness before creating
   */
  protected override async beforeCreate(
    data: CreateVariantOptionDTO,
  ): Promise<CreateVariantOptionDTO> {
    // Check for existing name+type combination
    const existing = await db
      .select()
      .from(variantOptions)
      .where(
        and(
          eq(variantOptions.name, data.name),
          eq(variantOptions.type, data.type),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestError(
        `Variant option "${data.name}" of type "${data.type}" already exists`,
      );
    }

    return data;
  }

  /**
   * Lifecycle hook: Validate uniqueness before updating
   */
  protected override async beforeUpdate(
    id: string,
    data: UpdateVariantOptionDTO,
  ): Promise<UpdateVariantOptionDTO> {
    // If changing name or type, validate uniqueness
    if (data.name || data.type) {
      const current = await this.getByIdString(id);
      if (!current) {
        throw new BadRequestError("Variant option not found");
      }

      const checkName = data.name || current.name;
      const checkType = data.type || current.type;

      const existing = await db
        .select()
        .from(variantOptions)
        .where(
          and(
            eq(variantOptions.name, checkName),
            eq(variantOptions.type, checkType),
          ),
        )
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        throw new BadRequestError(
          `Variant option "${checkName}" of type "${checkType}" already exists`,
        );
      }
    }

    return data;
  }

  /**
   * Override getById to work with UUID (string) IDs
   */
  override async getById(id: string): Promise<VariantOptionResponseDTO | null> {
    return this.getByIdString(id);
  }

  /**
   * Internal method to get by string ID (used by beforeUpdate)
   */
  private async getByIdString(
    id: string,
  ): Promise<VariantOptionResponseDTO | null> {
    const result = await db
      .select()
      .from(variantOptions)
      .where(eq(variantOptions.id, id))
      .limit(1);

    return result.length === 0 ? null : (result[0] as VariantOptionResponseDTO);
  }

  /**
   * Override delete to work with UUID (string) IDs
   */
  override async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(variantOptions)
      .where(eq(variantOptions.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Override update to work with UUID (string) IDs
   */
  override async update(
    id: string,
    data: UpdateVariantOptionDTO,
  ): Promise<VariantOptionResponseDTO | null> {
    const processedData = await this.beforeUpdate(id, data);

    const result = await db
      .update(variantOptions)
      .set(processedData)
      .where(eq(variantOptions.id, id))
      .returning();

    return result.length === 0 ? null : (result[0] as VariantOptionResponseDTO);
  }

  /**
   * Get all options grouped by type
   */
  async getGroupedByType(): Promise<VariantOptionsByType[]> {
    const all = await db
      .select()
      .from(variantOptions)
      .orderBy(asc(variantOptions.type), asc(variantOptions.displayOrder));

    // Group by type
    const grouped = new Map<string, VariantOptionResponseDTO[]>();

    for (const option of all) {
      const list = grouped.get(option.type) || [];
      list.push(option as VariantOptionResponseDTO);
      grouped.set(option.type, list);
    }

    return Array.from(grouped.entries()).map(([type, options]) => ({
      type,
      options,
    }));
  }

  /**
   * Get options by type
   */
  async getByType(type: string): Promise<VariantOptionResponseDTO[]> {
    const result = await db
      .select()
      .from(variantOptions)
      .where(eq(variantOptions.type, type))
      .orderBy(asc(variantOptions.displayOrder));

    return result as VariantOptionResponseDTO[];
  }

  /**
   * Get all unique types
   */
  async getTypes(): Promise<string[]> {
    const result = await db
      .selectDistinct({ type: variantOptions.type })
      .from(variantOptions)
      .orderBy(asc(variantOptions.type));

    return result.map((r) => r.type);
  }

  /**
   * Reorder options within a type
   */
  async reorderByType(type: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(variantOptions)
        .set({ displayOrder: i })
        .where(
          and(
            eq(variantOptions.id, orderedIds[i]),
            eq(variantOptions.type, type),
          ),
        );
    }
  }
}

export const variantOptionService = new VariantOptionService();
