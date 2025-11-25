/**
 * Generic Show/Detail Page Component
 * Displays ALL fields of a record in a structured layout
 */

import type { EntityConfig, FieldConfig } from "@/lib/admin/types.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { AccessDenied } from "@/components/admin/AccessDenied.tsx";

interface ShowPageProps<T = Record<string, unknown>> {
  config: EntityConfig<T>;
  item: T;
  error?: string;
  errorStatus?: number;
}

export function ShowPage<T = Record<string, unknown>>(
  { config, item, error, errorStatus }: ShowPageProps<T>,
) {
  // 403 Forbidden - Show access denied page
  if (errorStatus === 403) {
    return (
      <AdminLayout currentPath={`/admin/${config.name}`}>
        <AccessDenied
          message={error ||
            `You don't have permission to view this ${config.singularName}`}
          entityName={config.singularName}
        />
      </AdminLayout>
    );
  }

  // Check if item exists before accessing properties
  if (!item && !error) {
    return (
      <AdminLayout currentPath={`/admin/${config.name}`}>
        <div class="alert alert-warning">
          <span>{config.singularName} not found</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout currentPath={`/admin/${config.name}`}>
        <div class="alert alert-error">
          <span>{error}</span>
        </div>
      </AdminLayout>
    );
  }

  const identifier = config.getRouteParam
    ? config.getRouteParam(item!)
    : (item as Record<string, unknown>)[config.idField];

  const showFields = config.fields.filter((f) => f.showInShow !== false);

  const formatValue = (
    field: FieldConfig,
    value: unknown,
  ) => {
    if (field.render) {
      return field.render(value, item as Record<string, unknown>);
    }

    if (value === null || value === undefined) {
      return <span class="text-base-content/40">Not set</span>;
    }

    switch (field.type) {
      case "boolean":
        return value
          ? <span class="badge badge-success">Yes</span>
          : <span class="badge badge-ghost">No</span>;

      case "date":
        return new Date(value as string).toLocaleDateString();

      case "datetime":
        return new Date(value as string).toLocaleString();

      case "status":
        return <span class="badge badge-primary badge-lg">{String(value)}
        </span>;

      case "badge":
        return <span class="badge badge-outline badge-lg">{String(value)}
        </span>;

      case "json":
        if (typeof value === "object") {
          return (
            <pre class="p-4 bg-base-200 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        }
        return String(value);

      case "text":
        return (
          <div class="whitespace-pre-wrap p-4 bg-base-200 rounded-lg">
            {String(value)}
          </div>
        );

      case "email":
        return (
          <a href={`mailto:${value}`} class="link link-primary">
            {String(value)}
          </a>
        );

      default:
        if (field.format) {
          return field.format(value);
        }
        return <p class="text-lg">{String(value)}</p>;
    }
  };

  const getTitle = (): string => {
    if (config.showTitle) return config.showTitle;

    if (config.displayField) {
      const displayValue =
        (item as Record<string, unknown>)[config.displayField];
      return String(displayValue);
    }

    return `${config.singularName} Details`;
  };

  const getSubtitle = (): string | undefined => {
    if (config.descriptionField) {
      const value = (item as Record<string, unknown>)[config.descriptionField];
      return value ? String(value) : undefined;
    }
    return undefined;
  };

  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      <div class="space-y-6">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold">{getTitle()}</h1>
            {getSubtitle() && (
              <p class="text-base-content/60 mt-2">{getSubtitle()}</p>
            )}
          </div>
          <div class="flex gap-2">
            <a href={`/admin/${config.name}`} class="btn btn-ghost">
              Back to List
            </a>
            {config.canEdit !== false && (
              <a
                href={`/admin/${config.name}/${identifier}/edit`}
                class="btn btn-warning btn-ghost"
              >
                Edit
              </a>
            )}
          </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showFields.map((field) => {
                const value = (item as Record<string, unknown>)[field.name];
                const isFullWidth = field.type === "text" ||
                  field.type === "json";

                return (
                  <div
                    key={field.name}
                    class={isFullWidth ? "md:col-span-2" : ""}
                  >
                    <label class="label">
                      <span class="label-text font-bold text-base">
                        {field.label}
                      </span>
                    </label>
                    <div class="mt-1">{formatValue(field, value)}</div>
                    {field.helpText && (
                      <label class="label">
                        <span class="label-text-alt text-base-content/60">
                          {field.helpText}
                        </span>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
