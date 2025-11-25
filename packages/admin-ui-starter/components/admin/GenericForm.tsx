/**
 * Generic Form Component
 * Generates forms dynamically based on entity configuration
 * Professional styling with clear visual hierarchy
 */

import type { EntityConfig, FieldConfig } from "@/lib/admin/types.ts";

interface FormProps {
  config: EntityConfig<unknown>;
  item?: Record<string, unknown>;
  errors?: Record<string, string>;
  isEdit?: boolean;
}

export function GenericForm(
  { config, item, errors, isEdit }: FormProps,
) {
  const formFields = config.fields.filter((f) => f.showInForm !== false);

  const getValue = (fieldName: string): unknown => {
    if (item) {
      return (item as Record<string, unknown>)[fieldName];
    }
    return undefined;
  };

  const handleSubmit = (e: SubmitEvent) => {
    const form = e.target as HTMLFormElement;

    // Process JSON fields before submission
    formFields.forEach((field) => {
      if (field.type === "json") {
        const textarea = form.querySelector(
          `textarea[name="${field.name}"]`,
        ) as HTMLTextAreaElement | null;
        if (textarea && textarea.value) {
          try {
            // Validate and re-stringify to ensure clean JSON
            const parsed = JSON.parse(textarea.value);
            textarea.value = JSON.stringify(parsed);
          } catch (err) {
            e.preventDefault();
            alert(`Invalid JSON in ${field.label}: ${(err as Error).message}`);
          }
        }
      }
    });
  };

  const inputClasses =
    `w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all outline-none`;
  const textareaClasses =
    `w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all outline-none resize-none`;
  const selectClasses =
    `w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all outline-none cursor-pointer`;

  const renderField = (field: FieldConfig) => {
    const value = getValue(field.name);
    const error = errors?.[field.name];
    const hasError = !!error;

    // ID field - readonly in edit mode
    if (isEdit && field.name === config.idField) {
      return (
        <div key={field.name}>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            {field.label}
          </label>
          <input
            type="text"
            value={String(value || "")}
            disabled
            class="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
          />
          <p class="text-xs text-gray-500 mt-1.5">
            {field.name === "id"
              ? "ID cannot be changed"
              : "Key cannot be changed"}
          </p>
        </div>
      );
    }

    switch (field.type) {
      case "text":
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              name={field.name}
              required={field.required}
              class={`${textareaClasses} ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
              placeholder={field.placeholder}
              rows={field.rows || 4}
            >
              {String(value || "")}
            </textarea>
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <select
              name={field.name}
              required={field.required}
              class={`${selectClasses} ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
            >
              {!field.required && <option value="">-- Select --</option>}
              {field.options?.map((opt) => (
                <option
                  key={String(opt.value)}
                  value={String(opt.value)}
                  selected={value === opt.value}
                >
                  {opt.label}
                </option>
              ))}
            </select>
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );

      case "boolean":
        return (
          <div key={field.name} class="flex items-center gap-3">
            <input
              type="checkbox"
              name={field.name}
              class="w-5 h-5 border border-gray-300 rounded-md bg-white cursor-pointer accent-violet-500 checked:bg-violet-500"
              checked={Boolean(value)}
            />
            <label class="text-sm font-semibold text-gray-700 cursor-pointer flex-1">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            {error && <p class="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "number":
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              name={field.name}
              required={field.required}
              class={`${inputClasses} ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
              placeholder={field.placeholder}
              value={value !== null && value !== undefined ? String(value) : ""}
            />
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );

      case "email":
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="email"
              name={field.name}
              required={field.required}
              class={`${inputClasses} ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
              placeholder={field.placeholder}
              value={String(value || "")}
            />
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );

      case "password":
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="password"
              name={field.name}
              required={field.required}
              class={`${inputClasses} ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
              placeholder={field.placeholder}
              value={String(value || "")}
            />
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );

      case "date":
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="date"
              name={field.name}
              required={field.required}
              class={`${inputClasses} ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
              value={value
                ? new Date(value as string).toISOString().split("T")[0]
                : ""}
            />
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );

      case "datetime":
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="datetime-local"
              name={field.name}
              required={field.required}
              class={`${inputClasses} ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
              value={value
                ? new Date(value as string).toISOString().slice(0, 16)
                : ""}
            />
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );

      case "json":
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              name={field.name}
              required={field.required}
              class={`${textareaClasses} font-mono text-sm ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
              placeholder={field.placeholder || "Enter valid JSON"}
              rows={field.rows || 8}
            >
              {value && typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value || "")}
            </textarea>
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );

      default:
        // Default to text input
        return (
          <div key={field.name}>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              {field.label}
              {field.required && <span class="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              name={field.name}
              required={field.required}
              class={`${inputClasses} ${
                hasError ? "border-red-500 focus:ring-red-100" : ""
              }`}
              placeholder={field.placeholder}
              value={String(value || "")}
            />
            {error && <p class="text-xs text-red-500 mt-1.5">{error}</p>}
            {field.helpText && !error && (
              <p class="text-xs text-gray-500 mt-1.5">{field.helpText}</p>
            )}
          </div>
        );
    }
  };

  return (
    <form method="POST" class="space-y-6" onSubmit={handleSubmit}>
      <div class="space-y-5">
        {formFields.map((field) => renderField(field))}
      </div>

      <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
        <a
          href={`/admin/${config.name}`}
          class="px-6 py-2.5 text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </a>
        <button
          type="submit"
          class="px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          {isEdit ? "Save Changes" : `Create ${config.singularName}`}
        </button>
      </div>
    </form>
  );
}
