/**
 * Article Show Page
 * Uses generic ShowPage component
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { articleConfig } from "@/config/entities/articles.config.tsx";

const handlers = createCRUDHandlers(articleConfig);

export const handler = define.handlers({
  GET: handlers.show,
  DELETE: handlers.delete,
});

export default define.page<typeof handler>(
  function ArticleShowPageRoute({ data }) {
    return (
      <ShowPage
        config={data.config}
        item={data.item}
        error={data.error}
      />
    );
  },
);
