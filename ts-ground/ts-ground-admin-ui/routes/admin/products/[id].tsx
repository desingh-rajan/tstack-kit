/**
 * Product Show Page
 *
 * This is the STANDARD pattern for entity show pages.
 * Images are automatically rendered by ShowPage when the entity config
 * has a field with type: "image" and imageConfig.
 *
 * To add images to another entity (e.g., categories, articles):
 * 1. Add field with type: "image" and imageConfig in the entity's config
 * 2. Create API proxy routes for image upload/list/delete
 * 3. Use this same simple pattern - ShowPage handles the rest
 *
 * See: products.config.tsx for the images field configuration
 * See: routes/api/admin/[entity]/[entityId]/images.ts for proxy pattern
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { productConfig } from "@/config/entities/products.config.tsx";

const handlers = createCRUDHandlers(productConfig);

export const handler = define.handlers({
  GET: handlers.show,
  DELETE: handlers.delete,
});

export default define.page<typeof handler>(function ProductShowPage({ data }) {
  // Standard pattern - ShowPage handles everything including images
  return (
    <ShowPage
      config={data.config}
      item={data.item}
      error={data.error}
      errorStatus={data.errorStatus}
    />
  );
});
