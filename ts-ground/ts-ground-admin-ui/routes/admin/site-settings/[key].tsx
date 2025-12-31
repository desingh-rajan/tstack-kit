/**
 * Site Setting Show Page - Uses generic ShowPage component
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { siteSettingConfig } from "@/config/entities/site-settings.config.tsx";

const handlers = createCRUDHandlers(siteSettingConfig);

export const handler = define.handlers({
  GET: handlers.show,
});

export default define.page<typeof handler>(
  function SiteSettingShowPageRoute({ data }) {
    return (
      <ShowPage
        config={data.config}
        item={data.item}
        error={data.error}
      />
    );
  },
);
