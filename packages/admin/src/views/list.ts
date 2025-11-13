/**
 * List view component
 *
 * Renders a table with data, search, sorting, and pagination.
 */

import type { PaginationResult, ViewConfig } from "../core/types.ts";
import { generatePageNumbers } from "../core/pagination.ts";
import { escapeHtml } from "./utils.ts";

export interface ListViewOptions {
  result: PaginationResult<any>;
  config: ViewConfig;
  currentSearch?: string;
  currentOrderBy?: string;
  currentOrderDir?: "asc" | "desc";
}

/**
 * Render list view with table and pagination
 *
 * @param options - List view options
 * @returns HTML string
 */
export function renderList(options: ListViewOptions): string {
  const { result, config, currentSearch, currentOrderBy, currentOrderDir } =
    options;
  const { data, page, totalPages, hasPrevious, hasNext, total } = result;

  return `
<div class="space-y-4">
  <!-- Header with title and actions -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">${config.entityNamePlural}</h1>
      <p class="mt-1 text-sm text-gray-500">${total} total records</p>
    </div>
    <div class="flex space-x-2">
      <a 
        href="${config.baseUrl}/new" 
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        + New ${config.entityName}
      </a>
    </div>
  </div>

  <!-- Search and filters -->
  ${
    config.searchable && config.searchable.length > 0
      ? `
  <div class="bg-white rounded-lg shadow p-4">
    <form 
      hx-get="${config.baseUrl}" 
      hx-trigger="submit, keyup delay:500ms from:find input[name='search']" 
      hx-target="#data-table" 
      hx-swap="outerHTML"
      hx-indicator="#search-spinner"
      class="flex gap-2"
    >
      <div class="flex-1">
        <input 
          type="search" 
          name="search" 
          placeholder="Search ${config.searchable.join(", ")}..." 
          value="${currentSearch || ""}"
          class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button 
        type="submit" 
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
      >
        Search
      </button>
      ${
        currentSearch
          ? `
      <a 
        href="${config.baseUrl}" 
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
      >
        Clear
      </a>
      `
          : ""
      }
      <span id="search-spinner" class="htmx-indicator px-4 py-2 text-gray-500">
        🔄 Loading...
      </span>
    </form>
  </div>
  `
      : ""
  }

  <!-- Data table -->
  <div id="data-table" class="bg-white rounded-lg shadow overflow-hidden">
    ${
    data.length === 0
      ? `
    <div class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No records found</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new ${config.entityName}.</p>
      <div class="mt-6">
        <a 
          href="${config.baseUrl}/new" 
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          + New ${config.entityName}
        </a>
      </div>
    </div>
    `
      : `
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          ${
        config.columns.map((col) => {
          const isSortable = config.sortable?.includes(col);
          const isCurrentSort = currentOrderBy === col;
          const nextDir = isCurrentSort && currentOrderDir === "asc"
            ? "desc"
            : "asc";

          return `
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ${
            isSortable
              ? `
              <a 
                href="${config.baseUrl}?${
                currentSearch ? `search=${currentSearch}&` : ""
              }orderBy=${col}&orderDir=${nextDir}"
                hx-get="${config.baseUrl}?${
                currentSearch ? `search=${currentSearch}&` : ""
              }orderBy=${col}&orderDir=${nextDir}"
                hx-target="#data-table"
                hx-swap="outerHTML"
                class="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>${col}</span>
                ${
                isCurrentSort
                  ? `
                <span class="text-blue-600">
                  ${currentOrderDir === "asc" ? "↑" : "↓"}
                </span>
                `
                  : '<span class="text-gray-300">↕</span>'
              }
              </a>
              `
              : col
          }
            </th>
            `;
        }).join("")
      }
          <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        ${
        data.map((row) => {
          const idValue = row[config.columns[0]] || row.id || row.uuid;
          return `
          <tr class="hover:bg-gray-50">
            ${
            config.columns.map((col) => {
              let value = row[col];

              // Format different types
              if (value === null || value === undefined) {
                value = '<span class="text-gray-400">-</span>';
              } else if (typeof value === "boolean") {
                value = value
                  ? '<span class="text-green-600">✓</span>'
                  : '<span class="text-red-600">✗</span>';
              } else if (value instanceof Date) {
                value = escapeHtml(value.toLocaleString());
              } else if (typeof value === "object") {
                value = escapeHtml(JSON.stringify(value));
              } else {
                value = escapeHtml(value);
              }

              return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${value}</td>`;
            }).join("")
          }
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <a 
                href="${config.baseUrl}/${idValue}" 
                class="text-blue-600 hover:text-blue-900"
              >
                View
              </a>
              <a 
                href="${config.baseUrl}/${idValue}/edit" 
                class="text-indigo-600 hover:text-indigo-900"
              >
                Edit
              </a>
              <button 
                hx-delete="${config.baseUrl}/${idValue}"
                hx-confirm="Are you sure you want to delete this ${config.entityName}?"
                hx-target="closest tr"
                hx-swap="outerHTML swap:1s"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
          `;
        }).join("")
      }
      </tbody>
    </table>

    <!-- Pagination -->
    ${
        totalPages > 1
          ? `
    <div class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        ${
            hasPrevious
              ? `
        <a 
          href="${config.baseUrl}?page=${page - 1}${
                currentSearch ? `&search=${currentSearch}` : ""
              }"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Previous
        </a>
        `
              : "<span></span>"
          }
        ${
            hasNext
              ? `
        <a 
          href="${config.baseUrl}?page=${page + 1}${
                currentSearch ? `&search=${currentSearch}` : ""
              }"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Next
        </a>
        `
              : ""
          }
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Showing page <span class="font-medium">${page}</span> of <span class="font-medium">${totalPages}</span>
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            ${
            hasPrevious
              ? `
            <a 
              href="${config.baseUrl}?page=${page - 1}${
                currentSearch ? `&search=${currentSearch}` : ""
              }"
              hx-get="${config.baseUrl}?page=${page - 1}${
                currentSearch ? `&search=${currentSearch}` : ""
              }"
              hx-target="#data-table"
              hx-swap="outerHTML"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              ← Previous
            </a>
            `
              : ""
          }
            
            ${
            generatePageNumbers(page, totalPages).map((pageNum) => {
              if (pageNum === "...") {
                return `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
              }

              const isActive = pageNum === page;
              return `
              <a 
                href="${config.baseUrl}?page=${pageNum}${
                currentSearch ? `&search=${currentSearch}` : ""
              }"
                hx-get="${config.baseUrl}?page=${pageNum}${
                currentSearch ? `&search=${currentSearch}` : ""
              }"
                hx-target="#data-table"
                hx-swap="outerHTML"
                class="relative inline-flex items-center px-4 py-2 border ${
                isActive
                  ? "border-blue-500 bg-blue-50 text-blue-600 z-10"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              } text-sm font-medium"
              >
                ${pageNum}
              </a>
              `;
            }).join("")
          }
            
            ${
            hasNext
              ? `
            <a 
              href="${config.baseUrl}?page=${page + 1}${
                currentSearch ? `&search=${currentSearch}` : ""
              }"
              hx-get="${config.baseUrl}?page=${page + 1}${
                currentSearch ? `&search=${currentSearch}` : ""
              }"
              hx-target="#data-table"
              hx-swap="outerHTML"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              Next →
            </a>
            `
              : ""
          }
          </nav>
        </div>
      </div>
    </div>
    `
          : ""
      }
    `
  }
  </div>
</div>
  `;
}
