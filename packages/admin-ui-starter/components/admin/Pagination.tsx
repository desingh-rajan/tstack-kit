/**
 * Generic Pagination Component
 */

import type { PaginationParams } from "@/lib/admin/types.ts";

interface PaginationProps {
  pagination: PaginationParams;
  basePath: string;
}

export function Pagination({ pagination, basePath }: PaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const { page, totalPages, total, pageSize } = pagination;

  // Calculate page range to show
  const maxButtons = 7;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i,
  );

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
      {/* Info */}
      <div class="text-sm text-base-content/60">
        Showing {start} to {end} of {total} results
      </div>

      {/* Page buttons */}
      <div class="join">
        {/* First page */}
        {startPage > 1 && (
          <>
            <a href={`${basePath}?page=1`} class="join-item btn btn-sm">
              1
            </a>
            {startPage > 2 && (
              <button type="button" class="join-item btn btn-sm btn-disabled">
                ...
              </button>
            )}
          </>
        )}

        {/* Page numbers */}
        {pages.map((p) => (
          <a
            key={p}
            href={`${basePath}?page=${p}`}
            class={`join-item btn btn-sm ${p === page ? "btn-active" : ""}`}
          >
            {p}
          </a>
        ))}

        {/* Last page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <button type="button" class="join-item btn btn-sm btn-disabled">
                ...
              </button>
            )}
            <a
              href={`${basePath}?page=${totalPages}`}
              class="join-item btn btn-sm"
            >
              {totalPages}
            </a>
          </>
        )}
      </div>

      {/* Page size selector */}
      <div class="flex items-center gap-2">
        <span class="text-sm text-base-content/60">Per page:</span>
        <select
          class="select select-sm select-bordered"
          value={pageSize}
          onChange={(e) => {
            const target = e.target as HTMLSelectElement;
            if (typeof globalThis !== "undefined" && "location" in globalThis) {
              (globalThis as typeof globalThis & {
                location: { href: string };
              }).location.href = `${basePath}?page=1&pageSize=${target.value}`;
            }
          }}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
  );
}
