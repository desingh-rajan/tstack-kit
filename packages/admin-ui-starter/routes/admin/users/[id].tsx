/**
 * User Show Page - Uses generic ShowPage component
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { userConfig } from "@/config/entities/users.config.tsx";

const handlers = createCRUDHandlers(userConfig);

export const handler = define.handlers({
  GET: handlers.show,
  DELETE: handlers.delete,
});

export default define.page<typeof handler>(
  function UserShowPageRoute({ data }) {
    return (
      <ShowPage
        config={data.config}
        item={data.item}
        error={data.error}
      />
    );
  },
);
