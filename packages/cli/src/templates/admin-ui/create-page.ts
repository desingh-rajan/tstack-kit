import type { EntityNames } from "../../utils/stringUtils.ts";

export function generateCreatePageTemplate(names: EntityNames): string {
  return `/**
 * ${names.pascalSingular} Create Page
 * Uses generic form system
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { GenericForm } from "@/components/admin/GenericForm.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { ${names.singular}Config } from "@/config/entities/${names.snakePlural}.config.tsx";

const handlers = createCRUDHandlers(${names.singular}Config);

export const handler = define.handlers({
  GET: handlers.createGet,
  POST: handlers.createPost,
});

export default define.page<typeof handler>(function ${names.pascalSingular}CreatePage({ data }) {
  const { config, error, errors, values } = data;

  return (
    <AdminLayout currentPath={\`/admin/\${config.name}\`}>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold">
              {config.createTitle || \`Create New \${config.singularName}\`}
            </h1>
            <p class="text-base-content/60 mt-1">
              Fill in the details below
            </p>
          </div>
          <a href={\`/admin/\${config.name}\`} class="btn btn-ghost">
            Cancel
          </a>
        </div>

        {error && (
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <GenericForm
              config={config}
              item={values}
              errors={errors}
              isEdit={false}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
});
`;
}
