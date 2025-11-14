/**
 * Core types for @tstack/admin
 *
 * These types are framework and ORM agnostic.
 */

/**
 * Entity ID can be either number (auto-increment) or string (UUID)
 */
export type EntityId = number | string;

/**
 * Column that can be searched
 */
export type SearchableColumn = string;

/**
 * Column that can be sorted
 */
export type SortableColumn = string;

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Parameters for paginated list queries
 */
export interface PaginationParams {
  /** Current page number (1-based) */
  page: number;

  /** Number of items per page */
  limit: number;

  /** Search query string */
  search?: string;

  /** Columns to search in */
  searchColumns?: SearchableColumn[];

  /** Column to sort by */
  orderBy?: string;

  /** Sort direction */
  orderDir?: SortDirection;
}

/**
 * Result of a paginated query
 */
export interface PaginationResult<T> {
  /** Array of data items */
  data: T[];

  /** Total number of items (before pagination) */
  total: number;

  /** Current page number */
  page: number;

  /** Items per page */
  limit: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a previous page */
  hasPrevious: boolean;

  /** Whether there is a next page */
  hasNext: boolean;
}

/**
 * User role for authorization
 */
export type UserRole = "superadmin" | "admin" | "moderator" | "user";

/**
 * Authenticated user context
 */
export interface AuthUser {
  id: EntityId;
  email: string;
  username?: string;
  role: UserRole;
}
