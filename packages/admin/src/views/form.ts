/**
 * Form view component
 *
 * Renders create/edit forms for entities.
 */

import type { ViewConfig } from "../core/types.ts";
import { escapeHtml } from "./utils.ts";

export interface FormViewOptions {
  config: ViewConfig;
  data?: Record<string, any>;
  errors?: Record<string, string>;
  mode: "create" | "edit";
}

/**
 * Render form view for create/edit
 *
 * @param options - Form view options
 * @returns HTML string
 */
export function renderForm(options: FormViewOptions): string {
  const { config, data, errors, mode } = options;
  const isEdit = mode === "edit";
  const idValue = data?.[config.columns[0]] || data?.id || data?.uuid;

  return `
<div class="max-w-2xl">
  <div class="mb-6">
    <h1 class="text-2xl font-bold text-gray-900">
      ${isEdit ? `Edit ${config.entityName}` : `New ${config.entityName}`}
    </h1>
    <p class="mt-1 text-sm text-gray-500">
      ${
    isEdit
      ? `Update the fields below to edit this ${config.entityName}.`
      : `Fill in the fields below to create a new ${config.entityName}.`
  }
    </p>
  </div>

  ${
    errors && Object.keys(errors).length > 0
      ? `
  <div class="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
    <div class="flex">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800">
          There were errors with your submission
        </h3>
        <div class="mt-2 text-sm text-red-700">
          <ul class="list-disc pl-5 space-y-1">
            ${
        Object.entries(errors).map(([field, error]) => `
            <li>${field}: ${error}</li>
            `).join("")
      }
          </ul>
        </div>
      </div>
    </div>
  </div>
  `
      : ""
  }

  <form 
    method="POST" 
    action="${isEdit ? `${config.baseUrl}/${idValue}` : config.baseUrl}"
    class="bg-white rounded-lg shadow p-6 space-y-6"
  >
    ${isEdit ? `<input type="hidden" name="_method" value="PUT">` : ""}
    
    ${
    config.columns.slice(1).map((col) => {
      // Skip ID, createdAt, updatedAt columns
      if (
        ["id", "uuid", "createdAt", "updatedAt", "created_at", "updated_at"]
          .includes(col)
      ) {
        return "";
      }

      const value = data?.[col] || "";
      const error = errors?.[col];
      const fieldId = `field-${col}`;

      return `
      <div>
        <label for="${fieldId}" class="block text-sm font-medium text-gray-700 mb-1">
          ${
        col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, " $1")
      }
        </label>
        ${renderFieldInput(col, value, fieldId)}
        ${
        error
          ? `
        <p class="mt-1 text-sm text-red-600">${error}</p>
        `
          : ""
      }
      </div>
      `;
    }).filter(Boolean).join("")
  }

    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
      <a 
        href="${config.baseUrl}" 
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </a>
      <button 
        type="submit" 
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        ${isEdit ? "Update" : "Create"} ${config.entityName}
      </button>
    </div>
  </form>
</div>
  `;
}

/**
 * Render field input based on field name and type
 */
function renderFieldInput(
  fieldName: string,
  value: any,
  fieldId: string,
): string {
  const lowerName = fieldName.toLowerCase();

  // Boolean fields
  if (
    lowerName.includes("is") || lowerName.includes("has") ||
    lowerName.includes("published")
  ) {
    const checked = value === true || value === 1 || value === "1";
    return `
    <div class="flex items-center">
      <input 
        type="checkbox" 
        id="${fieldId}" 
        name="${fieldName}" 
        value="true"
        ${checked ? "checked" : ""}
        class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
      <label for="${fieldId}" class="ml-2 block text-sm text-gray-900">
        Enable
      </label>
    </div>
    `;
  }

  // Textarea for long text fields
  if (
    lowerName.includes("description") || lowerName.includes("content") ||
    lowerName.includes("body")
  ) {
    return `
    <textarea 
      id="${fieldId}" 
      name="${fieldName}" 
      rows="4"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
    >${escapeHtml(value || "")}</textarea>
    `;
  }

  // Number fields
  if (
    lowerName.includes("price") || lowerName.includes("count") ||
    lowerName.includes("quantity") || lowerName.includes("amount")
  ) {
    return `
    <input 
      type="number" 
      id="${fieldId}" 
      name="${fieldName}" 
      value="${escapeHtml(value || "")}"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
    />
    `;
  }

  // Email fields
  if (lowerName.includes("email")) {
    return `
    <input 
      type="email" 
      id="${fieldId}" 
      name="${fieldName}" 
      value="${escapeHtml(value || "")}"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
    />
    `;
  }

  // URL fields
  if (
    lowerName.includes("url") || lowerName.includes("link") ||
    lowerName.includes("website")
  ) {
    return `
    <input 
      type="url" 
      id="${fieldId}" 
      name="${fieldName}" 
      value="${escapeHtml(value || "")}"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
    />
    `;
  }

  // Default: text input
  return `
  <input 
    type="text" 
    id="${fieldId}" 
    name="${fieldName}" 
    value="${escapeHtml(value || "")}"
    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
  />
  `;
}
