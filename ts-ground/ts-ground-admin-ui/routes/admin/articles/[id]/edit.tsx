/**
 * Article Edit Page
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { GenericForm } from "@/components/admin/GenericForm.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { articleConfig } from "@/config/entities/articles.config.tsx";

const handlers = createCRUDHandlers(articleConfig);

export const handler = define.handlers({
  GET: handlers.editGet,
  POST: handlers.editPost,
});

export default define.page<typeof handler>(function ({ data }) {
  const { config, item, error, errors } = data;
  return (
    <AdminLayout currentPath={`/admin/${config.name}`}>
      <div class="space-y-6">
        <h1 class="text-3xl font-bold">Edit {config.singularName}</h1>
        {error && (
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        {item && (
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <GenericForm
                config={config as any}
                item={item}
                errors={errors}
                isEdit
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
});
