/**
 * Generic Admin Data Table Component
 * Shows ALL columns dynamically based on entity configuration
 */

import type { EntityConfig, FieldConfig } from "@/lib/admin/types.ts";
import DataTableActions from "@/islands/DataTableActions.tsx";

interface DataTableProps<T = Record<string, unknown>> {
  config: EntityConfig<T>;
  data: T[];
}

export function DataTable<T = Record<string, unknown>>(
  { config, data }: DataTableProps<T>,
) {
  if (data.length === 0) {
    return (
      <div class="text-center py-12">
        <p class="text-base-content/60">
          No {config.pluralName.toLowerCase()} found
        </p>
      </div>
    );
  }

  // Get fields to display in table
  const tableFields = config.fields.filter((f) => f.showInList !== false);

  const formatValue = (
    field: FieldConfig,
    value: unknown,
    record: T,
  ) => {
    // Custom render function
    if (field.render) {
      return field.render(value, record as Record<string, unknown>);
    }

    // Format by type
    if (value === null || value === undefined) {
      return <span class="text-base-content/40">-</span>;
    }

    switch (field.type) {
      case "boolean":
        return value
          ? <span class="badge badge-success badge-sm">Yes</span>
          : <span class="badge badge-ghost badge-sm">No</span>;

      case "date":
        return new Date(value as string).toLocaleDateString();

      case "datetime":
        return new Date(value as string).toLocaleString();

      case "status":
      case "badge":
        return <span class="badge badge-outline">{String(value)}</span>;

      case "json":
        if (typeof value === "object") {
          const str = JSON.stringify(value, null, 2);
          return (
            <pre class="text-xs max-w-xs overflow-hidden whitespace-pre-wrap">
              {str.slice(0, 100)}
              {str.length > 100 ? "..." : ""}
            </pre>
          );
        }
        return String(value);

      case "text": {
        const text = String(value);
        return (
          <div class="max-w-xs truncate" title={text}>
            {text}
          </div>
        );
      }

      default:
        if (field.format) {
          return field.format(value);
        }
        return String(value);
    }
  };

  const getIdentifier = (record: T): string | number => {
    if (config.getRouteParam) {
      return config.getRouteParam(record);
    }
    return (record as Record<string, unknown>)[config.idField] as
      | string
      | number;
  };

  return (
    <div class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            {tableFields.map((field) => (
              <th key={field.name}>
                {field.label}
                {field.sortable && (
                  <span class="ml-1 text-xs text-base-content/40">↕</span>
                )}
              </th>
            ))}
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={String(getIdentifier(record))}>
              {tableFields.map((field) => (
                <td key={field.name}>
                  {formatValue(
                    field,
                    (record as Record<string, unknown>)[field.name],
                    record,
                  )}
                </td>
              ))}
              <td>
                <DataTableActions
                  entityName={config.name}
                  identifier={getIdentifier(record)}
                  canView={config.canView !== false}
                  canEdit={config.canEdit !== false}
                  canDelete={config.canDelete !== false &&
                    !(config.isSystemRecord && config.isSystemRecord(record))}
                  singularName={config.singularName}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
