/**
 * Category Show Page
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { categoryConfig } from "@/config/entities/categories.config.tsx";

const handlers = createCRUDHandlers(categoryConfig);

export const handler = define.handlers({
  GET: handlers.show,
  DELETE: handlers.delete,
});

export default define.page<typeof handler>(function CategoryShowPage({ data }) {
  return (
    <ShowPage
      config={data.config}
      item={data.item}
      error={data.error}
    />
  );
});
