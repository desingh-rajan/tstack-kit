/**
 * Enquiries List Page
 * Uses generic CRUD system - read-only (no create)
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { DataTable } from "@/components/admin/DataTable.tsx";
import { Pagination } from "@/components/admin/Pagination.tsx";
import { AccessDenied } from "@/components/admin/AccessDenied.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { enquiryConfig } from "@/config/entities/enquiries.config.tsx";
import type { Enquiry } from "@/entities/enquiries/enquiry.types.ts";
import type { ListResponse } from "@/lib/admin/types.ts";

const handlers = createCRUDHandlers(enquiryConfig);

export const handler = define.handlers({
  GET: handlers.list,
});

export default define.page<typeof handler>(
  function EnquiriesListPage({ data }) {
    const { items, config, error, errorStatus } = data;
    const response = items as ListResponse<Enquiry>;

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
                Manage contact form submissions
              </p>
            </div>
            {/* No create button - enquiries come from public form */}
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
