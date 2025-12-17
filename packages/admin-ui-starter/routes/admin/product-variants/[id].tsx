/**
 * Product Variant Show Page
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { productVariantConfig } from "@/config/entities/product-variants.config.tsx";

const handlers = createCRUDHandlers(productVariantConfig);

export const handler = define.handlers({
  GET: handlers.show,
  DELETE: handlers.delete,
});

export default define.page<typeof handler>(function ProductVariantShowPage({
  data,
}) {
  return (
    <ShowPage
      config={data.config}
      item={data.item}
      error={data.error}
    />
  );
});
