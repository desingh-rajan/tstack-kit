import type { EntityNames } from "../../utils/stringUtils.ts";

export function generateListPageTemplate(names: EntityNames): string {
  return `/**
 * ${names.pascalPlural} List Page
 * Uses generic CRUD system
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { DataTable } from "@/components/admin/DataTable.tsx";
import { Pagination } from "@/components/admin/Pagination.tsx";
import { AccessDenied } from "@/components/admin/AccessDenied.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { ${names.singular}Config } from "@/config/entities/${names.snakePlural}.config.tsx";
import type { ${names.pascalSingular} } from "@/entities/${names.snakePlural}/${names.kebabSingular}.types.ts";
import type { ListResponse } from "@/lib/admin/types.ts";

const handlers = createCRUDHandlers(${names.singular}Config);

export const handler = define.handlers({
  GET: handlers.list,
});

export default define.page<typeof handler>(function ${names.pascalPlural}ListPage({ data }) {
  const { items, config, error, errorStatus } = data;
  const response = items as ListResponse<${names.pascalSingular}>;

  // Safely convert error to string
  const errorMessage = error
    ? (typeof error === "string" ? error : (error as { message?: string })?.message || "An error occurred")
    : null;

  // 403 Forbidden - Show access denied page
  if (errorStatus === 403) {
    return (
      <AdminLayout currentPath={\`/admin/\${config.name}\`}>
        <AccessDenied
          message={errorMessage ||
            \`You don't have permission to view \${config.pluralName}\`}
          entityName={config.pluralName}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPath={\`/admin/\${config.name}\`}>
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold">{config.pluralName}</h1>
            <p class="text-base-content/60 mt-1">
              Manage your {config.pluralName.toLowerCase()}
            </p>
          </div>
          {config.canCreate !== false && (
            <a
              href={\`/admin/\${config.name}/new\`}
              class="inline-flex items-center justify-center h-10 md:h-11 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-300 px-4 md:px-6 text-sm md:text-base"
            >
              Create New {config.singularName}
            </a>
          )}
        </div>

        {errorMessage && (
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <DataTable
              config={config}
              data={response.data}
            />

            {response.pagination && (
              <Pagination
                pagination={response.pagination}
                basePath={\`/admin/\${config.name}\`}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
});
`;
}
