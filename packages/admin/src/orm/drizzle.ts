/**
 * Drizzle ORM Adapter
 *
 * Implements the IORMAdapter interface for Drizzle ORM.
 * Supports both number and string (UUID) primary keys.
 */

import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type {
  EntityId,
  PaginationParams,
  PaginationResult,
} from "../core/types.ts";
import { buildPaginationResult } from "../core/pagination.ts";
import type { IORMAdapter, ORMAdapterConfig } from "./base.ts";

/**
 * Drizzle-specific adapter configuration
 */
export interface DrizzleAdapterConfig extends ORMAdapterConfig {
  /** Drizzle database instance */
  // deno-lint-ignore no-explicit-any
  db: any;
}

/**
 * Drizzle ORM Adapter
 *
 * @template T - Entity type
 *
 * @example
 * ```typescript
 * import { db } from "./config/database.ts";
 * import { products } from "./schema.ts";
 *
 * const adapter = new DrizzleAdapter(products, {
 *   db,
 *   idColumn: "id",
 *   idType: "number"
 * });
 * ```
 */
// deno-lint-ignore no-explicit-any
export class DrizzleAdapter<T extends Record<string, any>>
  implements IORMAdapter<T> {
  // deno-lint-ignore no-explicit-any
  private table: any; // Using any to allow dynamic column access
  private idColumn: string;
  private idType: "number" | "string";
  // deno-lint-ignore no-explicit-any
  private db: any;

  constructor(
    table: PgTable,
    config: DrizzleAdapterConfig,
  ) {
    this.table = table;
    this.db = config.db;
    this.idColumn = config.idColumn || "id";
    this.idType = config.idType || "number";
  }

  /**
   * Find many records with pagination, search, and sorting
   */
  async findMany(params: PaginationParams): Promise<PaginationResult<T>> {
    const { page, limit, search, searchColumns, orderBy, orderDir } = params;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build base query
    let query = this.db.select().from(this.table);

    // Add search conditions if provided
    if (search && searchColumns && searchColumns.length > 0) {
      const searchConditions = searchColumns.map((col) =>
        ilike(this.table[col], `%${search}%`)
      );
      query = query.where(or(...searchConditions));
    }

    // Add sorting if provided
    if (orderBy && this.table[orderBy]) {
      const orderFn = orderDir === "desc" ? desc : asc;
      query = query.orderBy(orderFn(this.table[orderBy]));
    } else {
      // Default sort by ID
      query = query.orderBy(desc(this.table[this.idColumn]));
    }

    // Add pagination
    query = query.limit(limit).offset(offset);

    // Execute query
    const data = await query;

    // Count total
    const total = await this.count(search, searchColumns);

    return buildPaginationResult(data as T[], page, limit, total);
  }

  /**
   * Find single record by ID
   */
  async findById(id: EntityId): Promise<T | null> {
    const parsedId = this.parseId(id);

    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table[this.idColumn], parsedId))
      .limit(1);

    return result.length > 0 ? (result[0] as T) : null;
  }

  /**
   * Create a new record
   * Auto-generates slug from name if table has both columns and slug is not provided
   * Ensures slug uniqueness by appending -1, -2, etc. if duplicate exists
   * Auto-increments displayOrder if column exists and no value provided
   */
  async create(data: Partial<T>): Promise<T> {
    // deno-lint-ignore no-explicit-any
    const createData: any = { ...data };

    // Remove undefined, null, and empty string values so DB defaults are applied
    for (const key of Object.keys(createData)) {
      if (
        createData[key] === undefined ||
        createData[key] === null ||
        createData[key] === ""
      ) {
        delete createData[key];
      }
    }

    // Auto-generate slug from name if:
    // 1. Table has both 'slug' and 'name' columns
    // 2. 'name' is provided but 'slug' is not
    if (
      "slug" in this.table &&
      "name" in this.table &&
      createData.name &&
      !createData.slug
    ) {
      const baseSlug = this.generateSlug(createData.name);
      createData.slug = await this.ensureUniqueSlug(baseSlug);
    }

    // Handle displayOrder: always auto-increment on create
    // User can adjust position via update after creation
    if ("displayOrder" in this.table) {
      createData.displayOrder = await this.getNextDisplayOrder();
    }

    const result = await this.db
      .insert(this.table)
      .values(createData)
      .returning();

    return result[0] as T;
  }

  /**
   * Get the next display order value (max + 1)
   */
  private async getNextDisplayOrder(): Promise<number> {
    const result = await this.db
      .select({ max: sql<number>`COALESCE(MAX(display_order), -1) + 1` })
      .from(this.table);

    return result[0]?.max ?? 0;
  }

  /**
   * Shift display order values to make room at a position
   * All items with displayOrder >= targetOrder get incremented by 1
   */
  private async shiftDisplayOrders(
    targetOrder: number,
    excludeId?: EntityId,
  ): Promise<void> {
    if (!("displayOrder" in this.table)) return;

    // Build condition: displayOrder >= targetOrder AND (id != excludeId if provided)
    const conditions = [gte(this.table.displayOrder, targetOrder)];
    if (excludeId !== undefined) {
      const parsedId = this.parseId(excludeId);
      conditions.push(ne(this.table[this.idColumn], parsedId));
    }

    await this.db
      .update(this.table)
      .set({ displayOrder: sql`display_order + 1` })
      .where(and(...conditions));
  }
  /**
   * Generate a URL-friendly slug from a string
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces and hyphens)
      .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Ensure slug is unique by appending -1, -2, etc. if duplicate exists
   */
  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    // Check if slug column exists
    if (!("slug" in this.table)) {
      return baseSlug;
    }

    // Check if base slug exists
    const existing = await this.db
      .select({ slug: this.table.slug })
      .from(this.table)
      .where(ilike(this.table.slug, `${baseSlug}%`));

    if (existing.length === 0) {
      return baseSlug;
    }

    // Extract existing slugs
    const existingSlugs = new Set(
      existing.map((r: { slug: string }) => r.slug.toLowerCase()),
    );

    // If base slug doesn't exist, use it
    if (!existingSlugs.has(baseSlug)) {
      return baseSlug;
    }

    // Find next available number
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;
    while (existingSlugs.has(uniqueSlug)) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    return uniqueSlug;
  }

  /**
   * Update an existing record
   */
  async update(id: EntityId, data: Partial<T>): Promise<T | null> {
    const parsedId = this.parseId(id);

    // Add updated timestamp if table has updatedAt column
    // deno-lint-ignore no-explicit-any
    const updateData: any = { ...data };
    if ("updatedAt" in this.table) {
      updateData.updatedAt = new Date();
    }

    // Handle displayOrder: shift existing items if position changes
    if (
      "displayOrder" in this.table &&
      updateData.displayOrder !== undefined
    ) {
      await this.shiftDisplayOrders(updateData.displayOrder, id);
    }

    const result = await this.db
      .update(this.table)
      .set(updateData)
      .where(eq(this.table[this.idColumn], parsedId))
      .returning();

    return result.length > 0 ? (result[0] as T) : null;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: EntityId): Promise<boolean> {
    const parsedId = this.parseId(id);

    const result = await this.db
      .delete(this.table)
      .where(eq(this.table[this.idColumn], parsedId))
      .returning();

    return result.length > 0;
  }

  /**
   * Bulk delete multiple records
   */
  async bulkDelete(ids: EntityId[]): Promise<number> {
    if (ids.length === 0) return 0;

    const parsedIds = ids.map((id) => this.parseId(id));

    // Use Drizzle's inArray() for safe bulk delete
    const result = await this.db
      .delete(this.table)
      .where(inArray(this.table[this.idColumn], parsedIds))
      .returning();

    return result.length;
  }

  /**
   * Count total records (for pagination)
   */
  async count(search?: string, searchColumns?: string[]): Promise<number> {
    let query = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table);

    // Add search conditions if provided
    if (search && searchColumns && searchColumns.length > 0) {
      const searchConditions = searchColumns.map((col) =>
        ilike(this.table[col], `%${search}%`)
      );
      query = query.where(or(...searchConditions));
    }

    const result = await query;
    return result[0]?.count || 0;
  }

  /**
   * Parse and validate ID based on configured type
   */
  private parseId(id: EntityId): number | string {
    if (this.idType === "number") {
      const parsed = typeof id === "string" ? parseInt(id, 10) : id;
      if (isNaN(parsed as number)) {
        throw new Error(`Invalid number ID: ${id}`);
      }
      return parsed;
    }

    // String ID (UUID)
    if (typeof id !== "string") {
      return String(id);
    }

    return id;
  }
}
