/**
 * FilterableDataTable Island
 * Client-side interactive data table with filtering, pagination, and instant updates
 *
 * NOTE: This component receives only serializable props (no functions).
 * Column rendering is handled via the `columns` prop with simple type-based formatting.
 */

import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import type { JSX } from "preact";
import type { PaginationParams } from "@/lib/admin/types.ts";
import { formatDateTime } from "@/lib/date.ts";
import { formatCurrency } from "@/lib/currency.ts";
import DatePicker from "@/islands/DatePicker.tsx";

// Filter definition type
export interface FilterDef {
  name: string;
  label: string;
  type: "text" | "select" | "date" | "daterange";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

// Column definition (serializable - no render functions)
export interface ColumnDef {
  key: string;
  label: string;
  type?:
    | "string"
    | "number"
    | "date"
    | "datetime"
    | "boolean"
    | "currency"
    | "badge"
    | "link"; // Link to detail page
  badgeColors?: Record<string, string>; // For badge type: value -> CSS class
  linkStyle?: "primary" | "default"; // For link type: styling
}

// Table configuration (serializable)
export interface TableConfig {
  entityName: string;
  singularName: string;
  pluralName: string;
  idField: string;
  columns: ColumnDef[];
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface FilterableDataTableProps {
  tableConfig: TableConfig;
  initialData: Record<string, unknown>[];
  initialPagination: PaginationParams;
  initialFilters?: Record<string, string>;
  apiEndpoint: string;
  filters?: FilterDef[];
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const debouncedValue = useSignal(value);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      debouncedValue.value = value;
    }, delay) as unknown as number;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue.value;
}

export default function FilterableDataTable({
  tableConfig,
  initialData,
  initialPagination,
  initialFilters = {},
  apiEndpoint,
  filters = [],
}: FilterableDataTableProps) {
  // State signals
  const data = useSignal<Record<string, unknown>[]>(initialData);
  const pagination = useSignal<PaginationParams>(initialPagination);
  const filterValues = useSignal<Record<string, string>>(initialFilters);
  const isLoading = useSignal(false);
  const error = useSignal<string | null>(null);

  // Text search with debounce
  const searchText = useSignal(initialFilters.search || "");
  const debouncedSearch = useDebounce(searchText.value, 300);

  // Fetch data from API
  const fetchData = async (
    page: number = 1,
    pageSize: number = pagination.value.pageSize,
    currentFilters: Record<string, string> = filterValues.value,
  ) => {
    isLoading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      // Add filter params (convert date values to ISO datetime for API)
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          // Convert date strings (YYYY-MM-DD) to ISO datetime
          if (key === "startDate" || key === "endDate") {
            // Validate it's a date format
            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              // For startDate, use start of day; for endDate, use end of day
              if (key === "startDate") {
                params.set(key, `${value}T00:00:00.000Z`);
              } else {
                params.set(key, `${value}T23:59:59.999Z`);
              }
            } else {
              params.set(key, value);
            }
          } else {
            params.set(key, value);
          }
        }
      });

      const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const result = await response.json();

      // Handle different response structures
      if (result.data) {
        if (Array.isArray(result.data)) {
          data.value = result.data;
          pagination.value = result.pagination || initialPagination;
        } else if (result.data.orders) {
          // Orders specific format
          data.value = result.data.orders;
          pagination.value = {
            page: result.data.pagination?.page || page,
            pageSize: result.data.pagination?.pageSize ||
              result.data.pagination?.limit || pageSize,
            total: result.data.pagination?.total || 0,
            totalPages: result.data.pagination?.totalPages || 1,
          };
        } else {
          data.value = result.data;
          pagination.value = result.pagination || initialPagination;
        }
      } else {
        data.value = [];
      }
    } catch (err) {
      console.error("FilterableDataTable fetch error:", err);
      error.value = err instanceof Error ? err.message : "Failed to load data";
    } finally {
      isLoading.value = false;
    }
  };

  // Watch debounced search and update filters
  useEffect(() => {
    if (debouncedSearch !== (filterValues.value.search || "")) {
      const newFilters = { ...filterValues.value, search: debouncedSearch };
      filterValues.value = newFilters;
      fetchData(1, pagination.value.pageSize, newFilters);
    }
  }, [debouncedSearch]);

  // Handle filter change (for select, date inputs)
  const handleFilterChange = (name: string, value: string) => {
    const newFilters = { ...filterValues.value, [name]: value };
    filterValues.value = newFilters;
    fetchData(1, pagination.value.pageSize, newFilters);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchData(newPage, pagination.value.pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    fetchData(1, newPageSize);
  };

  // Clear all filters
  const handleClearFilters = () => {
    searchText.value = "";
    filterValues.value = {};
    fetchData(1, pagination.value.pageSize, {});
  };

  // Format cell value based on column type
  const formatValue = (
    column: ColumnDef,
    value: unknown,
  ): JSX.Element | string => {
    if (value === null || value === undefined) {
      return <span class="text-base-content/40">-</span>;
    }

    switch (column.type) {
      case "boolean":
        return value
          ? <span class="badge badge-success badge-sm">Yes</span>
          : <span class="badge badge-ghost badge-sm">No</span>;
      case "date":
        return new Date(value as string).toLocaleDateString("en-IN", {
          timeZone: "UTC",
        });
      case "datetime":
        return formatDateTime(value as string);
      case "currency":
        return formatCurrency(value as string | number);
      case "badge": {
        const badgeClass = column.badgeColors?.[String(value)] || "badge-ghost";
        return <span class={`badge ${badgeClass}`}>{String(value)}</span>;
      }
      case "number":
        return String(value);
      case "link":
        // Link type is handled specially in the render - just return string here
        return String(value);
      default:
        return String(value);
    }
  };

  const { page, pageSize, total, totalPages } = pagination.value;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Calculate page range for pagination buttons
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  const pages = Array.from(
    { length: Math.max(0, endPage - startPage + 1) },
    (_, i) => startPage + i,
  );

  const hasActiveFilters = Object.values(filterValues.value).some((v) =>
    v && v.trim() !== ""
  );

  return (
    <div class="space-y-4">
      {/* Filter Bar */}
      {filters.length > 0 && (
        <div class="bg-base-200/50 rounded-lg p-4">
          <div class="flex flex-wrap gap-4 items-end">
            {filters.map((filter) => (
              <div key={filter.name} class="form-control">
                <label class="label py-1">
                  <span class="label-text text-sm">{filter.label}</span>
                </label>
                {filter.type === "text" && (
                  <input
                    type="text"
                    placeholder={filter.placeholder || `Search...`}
                    value={filter.name === "search"
                      ? searchText.value
                      : filterValues.value[filter.name] || ""}
                    onInput={(e) => {
                      const value = (e.target as HTMLInputElement).value;
                      if (filter.name === "search") {
                        searchText.value = value;
                      } else {
                        handleFilterChange(filter.name, value);
                      }
                    }}
                    class="input input-bordered input-sm w-48"
                  />
                )}
                {filter.type === "select" && (
                  <select
                    value={filterValues.value[filter.name] || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        filter.name,
                        (e.target as HTMLSelectElement).value,
                      )}
                    class="select select-bordered select-sm w-40"
                  >
                    <option value="">All</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {filter.type === "date" && (
                  <DatePicker
                    name={filter.name}
                    value={filterValues.value[filter.name] || ""}
                    onChange={(value) => handleFilterChange(filter.name, value)}
                    placeholder="DD/MM/YYYY"
                    size="sm"
                  />
                )}
                {filter.type === "daterange" && (
                  <div class="flex gap-2 items-center">
                    <DatePicker
                      name="startDate"
                      value={filterValues.value["startDate"] || ""}
                      onChange={(value) =>
                        handleFilterChange("startDate", value)}
                      placeholder="DD/MM/YYYY"
                      size="sm"
                    />
                    <span class="text-base-content/60">to</span>
                    <DatePicker
                      name="endDate"
                      value={filterValues.value["endDate"] || ""}
                      onChange={(value) =>
                        handleFilterChange("endDate", value)}
                      placeholder="DD/MM/YYYY"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                class="btn btn-ghost btn-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error.value && (
        <div class="alert alert-error">
          <span>{error.value}</span>
        </div>
      )}

      {/* Loading overlay */}
      <div class={`relative ${isLoading.value ? "opacity-60" : ""}`}>
        {isLoading.value && (
          <div class="absolute inset-0 flex items-center justify-center z-10">
            <span class="loading loading-spinner loading-lg text-primary" />
          </div>
        )}

        {/* Data Table */}
        {data.value.length === 0
          ? (
            <div class="text-center py-12">
              <p class="text-base-content/60">
                No {tableConfig.pluralName.toLowerCase()} found
              </p>
            </div>
          )
          : (
            <div class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    {tableConfig.columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.value.map((record) => {
                    const id = record[tableConfig.idField] as string | number;
                    return (
                      <tr key={String(id)}>
                        {tableConfig.columns.map((col) => (
                          <td key={col.key}>
                            {col.type === "link"
                              ? (
                                <a
                                  href={`/admin/${tableConfig.entityName}/${id}`}
                                  class={`font-semibold hover:underline ${
                                    col.linkStyle === "primary"
                                      ? "text-primary"
                                      : ""
                                  }`}
                                >
                                  {String(record[col.key] ?? "-")}
                                </a>
                              )
                              : (
                                formatValue(col, record[col.key])
                              )}
                          </td>
                        ))}
                        <td class="text-right">
                          <div class="flex gap-1 justify-end">
                            {tableConfig.canView !== false && (
                              <a
                                href={`/admin/${tableConfig.entityName}/${id}`}
                                class="btn btn-ghost btn-xs"
                              >
                                View
                              </a>
                            )}
                            {tableConfig.canEdit !== false && (
                              <a
                                href={`/admin/${tableConfig.entityName}/${id}/edit`}
                                class="btn btn-ghost btn-xs"
                              >
                                Edit
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Pagination */}
      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 px-2">
        {/* Info */}
        <div class="text-sm text-base-content/70">
          Showing <span class="font-medium">{Math.min(start, total)}</span> to
          {" "}
          <span class="font-medium">{end}</span> of{" "}
          <span class="font-medium">{total}</span> results
        </div>

        <div class="flex items-center gap-4">
          {/* Page size selector */}
          <div class="flex items-center gap-2">
            <span class="text-xs text-base-content/60 uppercase font-semibold tracking-wide">
              Per page
            </span>
            <select
              class="select select-bordered select-sm h-8 min-h-0 rounded-lg text-sm w-20 focus:ring-2 focus:ring-primary/20"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(
                parseInt((e.target as HTMLSelectElement).value),
              )}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          {/* Page buttons */}
          {totalPages > 1 && (
            <div class="join shadow-sm">
              {/* First page */}
              <button
                type="button"
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
                class={`join-item btn btn-sm btn-square bg-base-100 border-base-300 ${
                  page === 1 ? "btn-disabled opacity-50" : "hover:bg-base-200"
                }`}
                aria-label="First Page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Previous page */}
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                class={`join-item btn btn-sm btn-square bg-base-100 border-base-300 ${
                  page === 1 ? "btn-disabled opacity-50" : "hover:bg-base-200"
                }`}
                aria-label="Previous Page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Page numbers */}
              {pages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  class={`join-item btn btn-sm border-base-300 ${
                    p === page
                      ? "btn-primary text-primary-content"
                      : "bg-base-100 hover:bg-base-200"
                  }`}
                >
                  {p}
                </button>
              ))}

              {/* Next page */}
              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                class={`join-item btn btn-sm btn-square bg-base-100 border-base-300 ${
                  page === totalPages
                    ? "btn-disabled opacity-50"
                    : "hover:bg-base-200"
                }`}
                aria-label="Next Page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Last page */}
              <button
                type="button"
                onClick={() => handlePageChange(totalPages)}
                disabled={page === totalPages}
                class={`join-item btn btn-sm btn-square bg-base-100 border-base-300 ${
                  page === totalPages
                    ? "btn-disabled opacity-50"
                    : "hover:bg-base-200"
                }`}
                aria-label="Last Page"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
