import { and, asc, eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { productImages } from "./product-image.model.ts";
import { products } from "../products/product.model.ts";
import { BadRequestError, NotFoundError } from "../../shared/utils/errors.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import type {
  CreateProductImageDTO,
  ProductImageResponseDTO,
  UpdateProductImageDTO,
} from "./product-image.dto.ts";
import type { ProductImage } from "./product-image.model.ts";

/**
 * Product Image Service
 *
 * Handles product image CRUD with:
 * - Automatic primary image management
 * - Display order management
 * - Cascade delete with product
 */
export class ProductImageService extends BaseService<
  ProductImage,
  CreateProductImageDTO,
  UpdateProductImageDTO,
  ProductImageResponseDTO
> {
  constructor() {
    super(db, productImages);
  }

  /**
   * Lifecycle hook: Validate product exists and manage primary flag
   */
  protected override async beforeCreate(
    data: CreateProductImageDTO,
  ): Promise<CreateProductImageDTO> {
    // Validate product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (product.length === 0) {
      throw new NotFoundError("Product not found");
    }

    // If this is the first image or marked as primary, handle primary flag
    if (data.isPrimary) {
      await this.clearPrimaryFlag(data.productId);
    } else {
      // If no images exist yet, make this one primary
      const existingImages = await this.getByProductId(data.productId);
      if (existingImages.length === 0) {
        data.isPrimary = true;
      }
    }

    // Set thumbnailUrl to url if not provided
    if (!data.thumbnailUrl) {
      data.thumbnailUrl = data.url;
    }

    return data;
  }

  /**
   * Lifecycle hook: Manage primary flag on update
   */
  protected override async beforeUpdate(
    id: string,
    data: UpdateProductImageDTO,
  ): Promise<UpdateProductImageDTO> {
    if (data.isPrimary) {
      const image = await this.getByIdString(id);
      if (image) {
        await this.clearPrimaryFlag(image.productId, id);
      }
    }

    return data;
  }

  /**
   * Override getById to work with UUID (string) IDs
   */
  override async getById(id: string): Promise<ProductImageResponseDTO | null> {
    return this.getByIdString(id);
  }

  /**
   * Internal method to get by string ID
   */
  async getByIdString(id: string): Promise<ProductImageResponseDTO | null> {
    const result = await db
      .select()
      .from(productImages)
      .where(eq(productImages.id, id))
      .limit(1);

    return result.length === 0 ? null : (result[0] as ProductImageResponseDTO);
  }

  /**
   * Override delete to work with UUID (string) IDs
   */
  override async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(productImages)
      .where(eq(productImages.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Override update to work with UUID (string) IDs
   */
  override async update(
    id: string,
    data: UpdateProductImageDTO,
  ): Promise<ProductImageResponseDTO | null> {
    const processedData = await this.beforeUpdate(id, data);

    const result = await db
      .update(productImages)
      .set(processedData)
      .where(eq(productImages.id, id))
      .returning();

    return result.length === 0 ? null : (result[0] as ProductImageResponseDTO);
  }

  /**
   * Get all images for a product
   */
  async getByProductId(productId: string): Promise<ProductImageResponseDTO[]> {
    const result = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.displayOrder));

    return result as ProductImageResponseDTO[];
  }

  /**
   * Get primary image for a product
   */
  async getPrimaryImage(
    productId: string,
  ): Promise<ProductImageResponseDTO | null> {
    const result = await db
      .select()
      .from(productImages)
      .where(
        and(
          eq(productImages.productId, productId),
          eq(productImages.isPrimary, true),
        ),
      )
      .limit(1);

    return result.length > 0 ? (result[0] as ProductImageResponseDTO) : null;
  }

  /**
   * Set an image as primary
   */
  async setPrimary(imageId: string): Promise<void> {
    const image = await this.getById(imageId);
    if (!image) {
      throw new NotFoundError("Image not found");
    }

    await this.clearPrimaryFlag(image.productId, imageId);

    await db
      .update(productImages)
      .set({ isPrimary: true })
      .where(eq(productImages.id, imageId));
  }

  /**
   * Reorder images for a product
   */
  async reorder(productId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db
        .update(productImages)
        .set({ displayOrder: i })
        .where(
          and(
            eq(productImages.id, orderedIds[i]),
            eq(productImages.productId, productId),
          ),
        );
    }
  }

  /**
   * Delete all images for a product
   */
  async deleteByProductId(productId: string): Promise<void> {
    await db
      .delete(productImages)
      .where(eq(productImages.productId, productId));
  }

  /**
   * Helper: Clear primary flag for all images of a product
   */
  private async clearPrimaryFlag(
    productId: string,
    exceptId?: string,
  ): Promise<void> {
    let query = db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId));

    if (exceptId) {
      query = db
        .update(productImages)
        .set({ isPrimary: false })
        .where(
          and(
            eq(productImages.productId, productId),
            eq(productImages.isPrimary, true),
          ),
        );
    }

    await query;
  }
}

export const productImageService = new ProductImageService();
