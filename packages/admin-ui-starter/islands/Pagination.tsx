/**
 * Pagination Island
 *
 * Client-side interactive pagination component.
 * Preserves URL query params (filters) when navigating between pages.
 */

import type { PaginationParams } from "@/lib/admin/types.ts";

interface PaginationProps {
  pagination: PaginationParams;
  basePath: string;
  /**
   * Optional: Current URL search params string
   * Used to preserve filters when paginating.
   */
  currentParams?: string | URLSearchParams;
}

/**
 * Build URL with existing query params preserved
 */
function getPageUrl(
  basePath: string,
  newPage: number,
  newPageSize: number,
  currentParams?: string | URLSearchParams,
): string {
  let params: URLSearchParams;

  if (currentParams) {
    params = new URLSearchParams(currentParams.toString());
  } else if (typeof globalThis !== "undefined" && "location" in globalThis) {
    params = new URLSearchParams(
      (globalThis as typeof globalThis & { location: Location }).location
        .search,
    );
  } else {
    params = new URLSearchParams();
  }

  params.set("page", String(newPage));
  params.set("pageSize", String(newPageSize));

  return `${basePath}?${params.toString()}`;
}

// Navigation Icons
function FirstPageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
      />
    </svg>
  );
}

function PrevPageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}

function NextPageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function LastPageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 5l7 7-7 7M5 5l7 7-7 7"
      />
    </svg>
  );
}

export default function Pagination({
  pagination,
  basePath,
  currentParams,
}: PaginationProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const { page, totalPages, total, pageSize } = pagination;

  // Calculate page range to show
  const maxButtons = 5;
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

  const isFirstPage = page === 1;
  const isLastPage = page === totalPages;

  return (
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-base-100 rounded-lg shadow-sm">
      {/* Info */}
      <div class="text-sm text-base-content/60">
        Showing {start} to {end} of {total} results
      </div>

      {/* Page buttons */}
      <div class="join shadow-sm">
        {/* First page */}
        <a
          href={isFirstPage
            ? undefined
            : getPageUrl(basePath, 1, pageSize, currentParams)}
          class={`join-item btn btn-sm ${isFirstPage ? "btn-disabled" : ""}`}
          aria-label="First page"
          aria-disabled={isFirstPage}
        >
          <FirstPageIcon />
        </a>

        {/* Previous page */}
        <a
          href={isFirstPage
            ? undefined
            : getPageUrl(basePath, page - 1, pageSize, currentParams)}
          class={`join-item btn btn-sm ${isFirstPage ? "btn-disabled" : ""}`}
          aria-label="Previous page"
          aria-disabled={isFirstPage}
        >
          <PrevPageIcon />
        </a>

        {/* Ellipsis before */}
        {startPage > 1 && (
          <button type="button" class="join-item btn btn-sm btn-disabled">
            ...
          </button>
        )}

        {/* Page numbers */}
        {pages.map((p) => (
          <a
            key={p}
            href={getPageUrl(basePath, p, pageSize, currentParams)}
            class={`join-item btn btn-sm ${p === page ? "btn-active" : ""}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </a>
        ))}

        {/* Ellipsis after */}
        {endPage < totalPages && (
          <button type="button" class="join-item btn btn-sm btn-disabled">
            ...
          </button>
        )}

        {/* Next page */}
        <a
          href={isLastPage
            ? undefined
            : getPageUrl(basePath, page + 1, pageSize, currentParams)}
          class={`join-item btn btn-sm ${isLastPage ? "btn-disabled" : ""}`}
          aria-label="Next page"
          aria-disabled={isLastPage}
        >
          <NextPageIcon />
        </a>

        {/* Last page */}
        <a
          href={isLastPage
            ? undefined
            : getPageUrl(basePath, totalPages, pageSize, currentParams)}
          class={`join-item btn btn-sm ${isLastPage ? "btn-disabled" : ""}`}
          aria-label="Last page"
          aria-disabled={isLastPage}
        >
          <LastPageIcon />
        </a>
      </div>

      {/* Page size selector */}
      <div class="flex items-center gap-2">
        <span class="text-sm text-base-content/60">Per page:</span>
        <select
          class="select select-sm select-bordered"
          value={pageSize}
          onChange={(e) => {
            const target = e.target as HTMLSelectElement;
            const newPageSize = parseInt(target.value, 10);
            // Reset to page 1 when changing page size
            const url = getPageUrl(basePath, 1, newPageSize, currentParams);
            if (typeof globalThis !== "undefined" && "location" in globalThis) {
              (globalThis as typeof globalThis & {
                location: { href: string };
              }).location.href = url;
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
