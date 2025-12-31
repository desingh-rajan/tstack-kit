/**
 * Product Edit Page - REFERENCE TEMPLATE FOR ENTITIES WITH IMAGES
 *
 * This demonstrates the pattern for edit pages with image upload.
 * To add images to another entity (e.g., categories, articles):
 *
 * 1. Add imageConfig to your entity config:
 *    {
 *      name: "images",
 *      label: "Images",
 *      type: "image",
 *      showInForm: true,
 *      imageConfig: {
 *        entityType: "your-entity",  // S3 path prefix
 *        entityIdField: "id",
 *        multiple: true,
 *        maxFiles: 10,
 *        maxSize: 5 * 1024 * 1024,
 *      },
 *    }
 *
 * 2. Create API proxy routes (copy from products):
 *    - routes/api/admin/[entity]/[entityId]/images.ts (upload + list)
 *    - routes/api/admin/{entity}-images/[imageId].ts (delete)
 *    - routes/api/admin/{entity}-images/[imageId]/set-primary.ts (optional)
 *
 * 3. Copy this edit.tsx pattern to your entity's [id]/edit.tsx
 *    - Update the config import
 *    - Update entityType in ImageUploadPane
 *
 * Note: GenericForm automatically skips type: "image" fields,
 * so we render ImageUploadPane separately as its own section.
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { GenericForm } from "@/components/admin/GenericForm.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { productConfig } from "@/config/entities/products.config.tsx";
import ImageUploadPane from "@/islands/ImageUploadPane.tsx";

const handlers = createCRUDHandlers(productConfig);

export const handler = define.handlers({
  GET: handlers.editGet,
  POST: handlers.editPost,
});

export default define.page<typeof handler>(function ({ data }) {
  const { config, item, error, errors } = data;
  const entityId = item?.id as string | undefined;

  // Find image field config (if any) - makes this pattern portable
  const imageField = config.fields.find(
    (f) => f.type === "image" && f.imageConfig,
  );

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
          <>
            {/* Main Form */}
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

            {/* Images Section - rendered if entity has imageConfig */}
            {entityId && imageField?.imageConfig && (
              <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                  <h2 class="card-title text-xl mb-4">{imageField.label}</h2>
                  <ImageUploadPane
                    entityType={imageField.imageConfig.entityType}
                    entityId={entityId}
                    multiple={imageField.imageConfig.multiple}
                    maxFiles={imageField.imageConfig.maxFiles}
                    maxSize={imageField.imageConfig.maxSize}
                    accept={imageField.imageConfig.accept}
                    label="Upload Images"
                    helpText="Drag and drop images or click to upload."
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
});
