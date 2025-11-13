/**
 * ORM Adapter Interface
 *
 * All ORM adapters (Drizzle, Sequelize, Prisma, TypeORM) must implement this interface.
 * This allows the admin system to work with any ORM.
 */

import type {
  EntityId,
  PaginationParams,
  PaginationResult,
} from "../core/types.ts";

/**
 * Configuration for ORM adapters
 */
export interface ORMAdapterConfig {
  /** Name of the ID column (default: "id") */
  idColumn?: string;

  /** Type of the ID column (default: "number") */
  idType?: "number" | "string";

  /** Database connection (if needed by ORM) */
  db?: any;
}

/**
 * ORM Adapter Interface
 *
 * Provides a unified interface for database operations across different ORMs.
 *
 * @template T - The entity type
 */
export interface IORMAdapter<T> {
  /**
   * Find multiple records with pagination, search, and sorting
   *
   * @param params - Pagination and filter parameters
   * @returns Paginated result with data and metadata
   */
  findMany(params: PaginationParams): Promise<PaginationResult<T>>;

  /**
   * Find a single record by ID
   *
   * @param id - Entity ID (number or string)
   * @returns The entity or null if not found
   */
  findById(id: EntityId): Promise<T | null>;

  /**
   * Create a new record
   *
   * @param data - Entity data to create
   * @returns The created entity
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Update an existing record
   *
   * @param id - Entity ID
   * @param data - Fields to update
   * @returns The updated entity or null if not found
   */
  update(id: EntityId, data: Partial<T>): Promise<T | null>;

  /**
   * Delete a record by ID
   *
   * @param id - Entity ID
   * @returns True if deleted, false if not found
   */
  delete(id: EntityId): Promise<boolean>;

  /**
   * Delete multiple records by IDs
   *
   * @param ids - Array of entity IDs
   * @returns Number of records deleted
   */
  bulkDelete(ids: EntityId[]): Promise<number>;

  /**
   * Count total records (for pagination)
   *
   * @param search - Optional search query
   * @param searchColumns - Columns to search in
   * @returns Total count
   */
  count(search?: string, searchColumns?: string[]): Promise<number>;
}
