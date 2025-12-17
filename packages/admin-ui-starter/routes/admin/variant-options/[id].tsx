/**
 * Variant Option Show Page
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { variantOptionConfig } from "@/config/entities/variant-options.config.tsx";

const handlers = createCRUDHandlers(variantOptionConfig);

export const handler = define.handlers({
  GET: handlers.show,
  DELETE: handlers.delete,
});

export default define.page<typeof handler>(function VariantOptionShowPage({
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
