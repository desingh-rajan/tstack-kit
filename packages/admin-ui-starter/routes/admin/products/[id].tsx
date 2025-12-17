/**
 * Product Show Page
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
  return (
    <ShowPage
      config={data.config}
      item={data.item}
      error={data.error}
    />
  );
});
