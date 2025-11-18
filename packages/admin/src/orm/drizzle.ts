/**
 * Drizzle ORM Adapter
 *
 * Implements the IORMAdapter interface for Drizzle ORM.
 * Supports both number and string (UUID) primary keys.
 */

import { asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
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
   */
  async create(data: Partial<T>): Promise<T> {
    const result = await this.db
      .insert(this.table)
      .values(data)
      .returning();

    return result[0] as T;
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
