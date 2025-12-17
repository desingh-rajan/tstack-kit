import { and, eq, getTableColumns } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { productVariants } from "./product-variant.model.ts";
import { productImages } from "../product_images/product-image.model.ts";
import { products } from "../products/product.model.ts";
import { BadRequestError, NotFoundError } from "../../shared/utils/errors.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import type {
  BulkCreateVariantsDTO,
  CreateProductVariantDTO,
  ProductVariantResponseDTO,
  UpdateProductVariantDTO,
} from "./product-variant.dto.ts";
import type { ProductVariant } from "./product-variant.model.ts";

/**
 * Product Variant Service
 *
 * Handles variant CRUD with:
 * - SKU uniqueness validation
 * - Image association
 * - Bulk variant creation
 */
export class ProductVariantService extends BaseService<
  ProductVariant,
  CreateProductVariantDTO,
  UpdateProductVariantDTO,
  ProductVariantResponseDTO
> {
  constructor() {
    super(db, productVariants);
  }

  /**
   * Lifecycle hook: Validate product and SKU before creating
   */
  protected override async beforeCreate(
    data: CreateProductVariantDTO,
  ): Promise<CreateProductVariantDTO> {
    // Validate product exists
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (product.length === 0) {
      throw new NotFoundError("Product not found");
    }

    // Validate SKU uniqueness
    if (data.sku) {
      const existingSku = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.sku, data.sku))
        .limit(1);

      if (existingSku.length > 0) {
        throw new BadRequestError(
          `Variant with SKU "${data.sku}" already exists`,
        );
      }
    }

    // Validate image belongs to product
    if (data.imageId) {
      const image = await db
        .select()
        .from(productImages)
        .where(
          and(
            eq(productImages.id, data.imageId),
            eq(productImages.productId, data.productId),
          ),
        )
        .limit(1);

      if (image.length === 0) {
        throw new BadRequestError(
          "Image not found or does not belong to this product",
        );
      }
    }

    return data;
  }

  /**
   * Lifecycle hook: Validate SKU before updating
   */
  protected override async beforeUpdate(
    id: string,
    data: UpdateProductVariantDTO,
  ): Promise<UpdateProductVariantDTO> {
    // Validate SKU uniqueness
    if (data.sku) {
      const existingSku = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.sku, data.sku))
        .limit(1);

      if (existingSku.length > 0 && existingSku[0].id !== id) {
        throw new BadRequestError(
          `Variant with SKU "${data.sku}" already exists`,
        );
      }
    }

    // Add updatedAt
    return { ...data };
  }

  /**
   * Override getById to work with UUID (string) IDs
   */
  override async getById(
    id: string,
  ): Promise<ProductVariantResponseDTO | null> {
    const result = await db
      .select({
        ...getTableColumns(productVariants),
        image: {
          id: productImages.id,
          url: productImages.url,
          thumbnailUrl: productImages.thumbnailUrl,
        },
      })
      .from(productVariants)
      .leftJoin(productImages, eq(productVariants.imageId, productImages.id))
      .where(eq(productVariants.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      ...row,
      options: row.options as Record<string, string>,
      image: row.image?.id ? row.image : null,
    };
  }

  /**
   * Override delete to work with UUID (string) IDs
   */
  override async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(productVariants)
      .where(eq(productVariants.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Override update to work with UUID (string) IDs
   */
  override async update(
    id: string,
    data: UpdateProductVariantDTO,
  ): Promise<ProductVariantResponseDTO | null> {
    const processedData = await this.beforeUpdate(id, data);

    const result = await db
      .update(productVariants)
      .set({ ...processedData, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    // Fetch with relations
    return this.getById(id);
  }

  /**
   * Get all variants for a product with images
   */
  async getByProductId(
    productId: string,
  ): Promise<ProductVariantResponseDTO[]> {
    const result = await db
      .select({
        ...getTableColumns(productVariants),
        image: {
          id: productImages.id,
          url: productImages.url,
          thumbnailUrl: productImages.thumbnailUrl,
        },
      })
      .from(productVariants)
      .leftJoin(productImages, eq(productVariants.imageId, productImages.id))
      .where(eq(productVariants.productId, productId));

    return result.map((row) => ({
      ...row,
      options: row.options as Record<string, string>,
      image: row.image?.id ? row.image : null,
    }));
  }

  /**
   * Get variant by SKU
   */
  async getBySku(sku: string): Promise<ProductVariantResponseDTO | null> {
    const result = await db
      .select({
        ...getTableColumns(productVariants),
        image: {
          id: productImages.id,
          url: productImages.url,
          thumbnailUrl: productImages.thumbnailUrl,
        },
      })
      .from(productVariants)
      .leftJoin(productImages, eq(productVariants.imageId, productImages.id))
      .where(eq(productVariants.sku, sku))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      ...row,
      options: row.options as Record<string, string>,
      image: row.image?.id ? row.image : null,
    };
  }

  /**
   * Bulk create variants for a product
   */
  async bulkCreate(
    data: BulkCreateVariantsDTO,
  ): Promise<ProductVariantResponseDTO[]> {
    const created: ProductVariantResponseDTO[] = [];

    for (const variant of data.variants) {
      const result = await this.create({
        productId: data.productId,
        ...variant,
        isActive: true,
      });
      created.push(result);
    }

    return created;
  }

  /**
   * Update stock quantity for a variant
   */
  async updateStock(id: string, quantity: number): Promise<void> {
    await db
      .update(productVariants)
      .set({ stockQuantity: quantity, updatedAt: new Date() })
      .where(eq(productVariants.id, id));
  }

  /**
   * Adjust stock quantity (add/subtract)
   */
  async adjustStock(id: string, adjustment: number): Promise<void> {
    const variant = await this.getById(id);
    if (!variant) {
      throw new NotFoundError("Variant not found");
    }

    const newQuantity = Math.max(0, variant.stockQuantity + adjustment);
    await this.updateStock(id, newQuantity);
  }

  /**
   * Delete all variants for a product
   */
  async deleteByProductId(productId: string): Promise<void> {
    await db
      .delete(productVariants)
      .where(eq(productVariants.productId, productId));
  }
}

export const productVariantService = new ProductVariantService();
