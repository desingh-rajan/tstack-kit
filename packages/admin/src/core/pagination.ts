/**
 * Pagination utilities
 *
 * Pure functions for calculating pagination metadata.
 * Framework and ORM agnostic.
 */

import type { PaginationResult } from "./types.ts";

/**
 * Pagination metadata (calculated values)
 */
export interface PaginationMeta {
  /** Offset for database query (0-based) */
  offset: number;

  /** Current page (1-based) */
  page: number;

  /** Items per page */
  limit: number;

  /** Total number of items */
  total: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a previous page */
  hasPrevious: boolean;

  /** Whether there is a next page */
  hasNext: boolean;
}

/**
 * Calculate pagination metadata
 *
 * @param page - Current page number (1-based)
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 *
 * @example
 * ```typescript
 * const meta = calculatePagination(2, 20, 150);
 * // { page: 2, limit: 20, offset: 20, total: 150, totalPages: 8, hasPrevious: true, hasNext: true }
 * ```
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  // Validate and sanitize inputs
  const sanitizedPage = Math.max(1, Math.floor(page));
  const sanitizedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const sanitizedTotal = Math.max(0, Math.floor(total));

  // Calculate values
  const totalPages = Math.ceil(sanitizedTotal / sanitizedLimit) || 1;
  const boundedPage = Math.min(sanitizedPage, totalPages);
  const offset = (boundedPage - 1) * sanitizedLimit;
  const hasPrevious = boundedPage > 1;
  const hasNext = boundedPage < totalPages;

  return {
    page: boundedPage,
    limit: sanitizedLimit,
    offset,
    total: sanitizedTotal,
    totalPages,
    hasPrevious,
    hasNext,
  };
}

/**
 * Build a complete pagination result
 *
 * @param data - Array of data items
 * @param page - Current page
 * @param limit - Items per page
 * @param total - Total count
 * @returns Complete pagination result
 *
 * @example
 * ```typescript
 * const result = buildPaginationResult(products, 1, 20, 150);
 * ```
 */
export function buildPaginationResult<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
): PaginationResult<T> {
  const meta = calculatePagination(page, limit, total);

  return {
    data,
    page: meta.page,
    limit: meta.limit,
    total: meta.total,
    totalPages: meta.totalPages,
    hasPrevious: meta.hasPrevious,
    hasNext: meta.hasNext,
  };
}

/**
 * Generate page numbers for pagination UI
 *
 * @param currentPage - Current page
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum number of page links to show (default: 7)
 * @returns Array of page numbers to display
 *
 * @example
 * ```typescript
 * generatePageNumbers(5, 10, 7);
 * // [1, "...", 4, 5, 6, "...", 10]
 * ```
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7,
): (number | "...")[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const halfVisible = Math.floor((maxVisible - 2) / 2);

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let start = Math.max(2, currentPage - halfVisible);
  let end = Math.min(totalPages - 1, currentPage + halfVisible);

  // Adjust if we're near the start
  if (currentPage <= halfVisible + 2) {
    end = Math.min(totalPages - 1, maxVisible - 1);
  }

  // Adjust if we're near the end
  if (currentPage >= totalPages - halfVisible - 1) {
    start = Math.max(2, totalPages - maxVisible + 2);
  }

  // Add ellipsis if needed
  if (start > 2) {
    pages.push("...");
  }

  // Add middle pages
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add ellipsis if needed
  if (end < totalPages - 1) {
    pages.push("...");
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
