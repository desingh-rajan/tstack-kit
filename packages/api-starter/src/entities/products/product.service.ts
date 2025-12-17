import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  isNull,
  like,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "../../config/database.ts";
import { products, type ProductWithRelations } from "./product.model.ts";
import { brands } from "../brands/brand.model.ts";
import { categories } from "../categories/category.model.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import { ensureUniqueSlug, generateSlug } from "../../lib/slug.ts";
import type {
  CreateProductDTO,
  ProductListResponseDTO,
  ProductQueryDTO,
  ProductResponseDTO,
  UpdateProductDTO,
} from "./product.dto.ts";
import type { Product } from "./product.model.ts";

/**
 * Product Service
 *
 * Handles product CRUD with:
 * - Slug generation
 * - Soft delete
 * - Filtering, search, pagination
 * - Relations (brand, category)
 */
export class ProductService extends BaseService<
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductResponseDTO
> {
  constructor() {
    super(db, products);
  }

  /**
   * Lifecycle hook: Generate slug before creating
   */
  protected override async beforeCreate(
    data: CreateProductDTO,
  ): Promise<CreateProductDTO> {
    let slug = data.slug || generateSlug(data.name);

    // Check for existing slugs and make unique if needed
    const existingSlugs = await this.getExistingSlugs();
    slug = ensureUniqueSlug(slug, existingSlugs);

    // Validate SKU uniqueness
    if (data.sku) {
      const existingSku = await db
        .select()
        .from(products)
        .where(eq(products.sku, data.sku))
        .limit(1);

      if (existingSku.length > 0) {
        throw new BadRequestError(
          `Product with SKU "${data.sku}" already exists`,
        );
      }
    }

    return { ...data, slug };
  }

  /**
   * Lifecycle hook: Validate before updating
   */
  protected override async beforeUpdate(
    id: string,
    data: UpdateProductDTO,
  ): Promise<UpdateProductDTO> {
    // Validate slug uniqueness
    if (data.slug) {
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.slug, data.slug))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== id) {
        throw new BadRequestError(
          `Product with slug "${data.slug}" already exists`,
        );
      }
    }

    // If name changed but slug not provided, generate new slug
    if (data.name && !data.slug) {
      const existingSlugs = await this.getExistingSlugs(id);
      data.slug = ensureUniqueSlug(generateSlug(data.name), existingSlugs);
    }

    // Validate SKU uniqueness
    if (data.sku) {
      const existingSku = await db
        .select()
        .from(products)
        .where(eq(products.sku, data.sku))
        .limit(1);

      if (existingSku.length > 0 && existingSku[0].id !== id) {
        throw new BadRequestError(
          `Product with SKU "${data.sku}" already exists`,
        );
      }
    }

    return data;
  }

  /**
   * Get products with filtering, search, and pagination
   */
  async getProducts(query: ProductQueryDTO): Promise<ProductListResponseDTO> {
    const {
      page,
      limit,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
    } = query;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [
      isNull(products.deletedAt), // Exclude soft-deleted
      eq(products.isActive, true), // Only active products
    ];

    // Category filter (by slug)
    if (category) {
      const cat = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category))
        .limit(1);

      if (cat.length > 0) {
        conditions.push(eq(products.categoryId, cat[0].id));
      }
    }

    // Brand filter (by slug)
    if (brand) {
      const br = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.slug, brand))
        .limit(1);

      if (br.length > 0) {
        conditions.push(eq(products.brandId, br[0].id));
      }
    }

    // Price filters
    if (minPrice !== undefined) {
      conditions.push(gte(products.price, String(minPrice)));
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(products.price, String(maxPrice)));
    }

    // Stock filter
    if (inStock !== undefined) {
      if (inStock) {
        conditions.push(gt(products.stockQuantity, 0));
      } else {
        conditions.push(eq(products.stockQuantity, 0));
      }
    }

    // Build where clause
    let whereClause = and(...conditions);

    // Search filter (name, description, SKU)
    if (search) {
      const searchPattern = `%${search}%`;
      whereClause = and(
        whereClause,
        or(
          like(products.name, searchPattern),
          like(products.description, searchPattern),
          like(products.sku, searchPattern),
        ),
      );
    }

    // Sort
    const orderByColumn = sortBy === "price"
      ? products.price
      : sortBy === "name"
      ? products.name
      : products.createdAt;

    const orderByDirection = sortOrder === "asc"
      ? asc(orderByColumn)
      : desc(orderByColumn);

    // Execute query with joins
    const result = await db
      .select({
        ...getTableColumns(products),
        brand: {
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderByDirection)
      .limit(limit)
      .offset(offset);

    // Count total
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    const total = countResult[0]?.count ?? 0;

    return {
      data: result.map((row) => ({
        ...row,
        specifications: row.specifications as Record<string, unknown>,
        brand: row.brand?.id ? row.brand : null,
        category: row.category?.id ? row.category : null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get product by slug with relations
   */
  async getBySlug(slug: string): Promise<ProductWithRelations | null> {
    const result = await db
      .select({
        ...getTableColumns(products),
        brand: {
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.slug, slug),
          isNull(products.deletedAt),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      ...row,
      specifications: row.specifications as Record<string, unknown>,
      brand: row.brand?.id ? row.brand : null,
      category: row.category?.id ? row.category : null,
    };
  }

  /**
   * Get product by ID with relations
   */
  override async getById(id: string): Promise<ProductWithRelations | null> {
    const result = await db
      .select({
        ...getTableColumns(products),
        brand: {
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      ...row,
      specifications: row.specifications as Record<string, unknown>,
      brand: row.brand?.id ? row.brand : null,
      category: row.category?.id ? row.category : null,
    };
  }

  /**
   * Soft delete a product
   */
  async softDelete(id: string): Promise<void> {
    await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  /**
   * Override delete to work with UUID (string) IDs - hard delete
   */
  override async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));

    return (result as any).rowCount > 0;
  }

  /**
   * Override update to work with UUID (string) IDs
   */
  override async update(
    id: string,
    data: UpdateProductDTO,
  ): Promise<ProductResponseDTO | null> {
    const processedData = await this.beforeUpdate(id, data);

    const result = await db
      .update(products)
      .set({ ...processedData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return result.length === 0 ? null : (result[0] as ProductResponseDTO);
  }

  /**
   * Restore a soft-deleted product
   */
  async restore(id: string): Promise<void> {
    await db
      .update(products)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(products.id, id));
  }

  /**
   * Helper: Get all existing slugs
   */
  private async getExistingSlugs(excludeId?: string): Promise<string[]> {
    const allProducts = await db.select({ slug: products.slug }).from(products);
    return allProducts
      .filter((p) => !excludeId || p.slug !== excludeId)
      .map((p) => p.slug);
  }
}

export const productService = new ProductService();
