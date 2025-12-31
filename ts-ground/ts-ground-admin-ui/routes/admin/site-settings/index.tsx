/**
 * Site Settings List Page - Uses generic CRUD system
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { DataTable } from "@/components/admin/DataTable.tsx";
import { Pagination } from "@/components/admin/Pagination.tsx";
import { AccessDenied } from "@/components/admin/AccessDenied.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { siteSettingConfig } from "@/config/entities/site-settings.config.tsx";
import type { SiteSetting } from "@/entities/site_settings/site-setting.types.ts";
import type { ListResponse } from "@/lib/admin/types.ts";

const handlers = createCRUDHandlers(siteSettingConfig);

export const handler = define.handlers({
  GET: handlers.list,
});

export default define.page<typeof handler>(
  function SiteSettingsListPage({ data }) {
    const { items, config, error, errorStatus } = data;
    const response = items as ListResponse<SiteSetting>;

    // 403 Forbidden - Show access denied page
    if (errorStatus === 403) {
      return (
        <AdminLayout currentPath={`/admin/${config.name}`}>
          <AccessDenied
            message={error ||
              `You don't have permission to view ${config.pluralName}`}
            entityName={config.pluralName}
          />
        </AdminLayout>
      );
    }

    return (
      <AdminLayout currentPath={`/admin/${config.name}`}>
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
                href={`/admin/${config.name}/new`}
                class="inline-flex items-center justify-center h-10 md:h-11 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-300 px-4 md:px-6 text-sm md:text-base"
              >
                Create New {config.singularName}
              </a>
            )}
          </div>

          {error && (
            <div class="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <DataTable config={config} data={response.data} />

              {response.pagination && (
                <Pagination
                  pagination={response.pagination}
                  basePath={`/admin/${config.name}`}
                />
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  },
);
