/**
 * Enquiry Show Page
 * Uses generic ShowPage component
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { enquiryConfig } from "@/config/entities/enquiries.config.tsx";

const handlers = createCRUDHandlers(enquiryConfig);

export const handler = define.handlers({
  GET: handlers.show,
  DELETE: handlers.delete,
});

export default define.page<typeof handler>(
  function EnquiryShowPageRoute({ data }) {
    return (
      <ShowPage
        config={data.config}
        item={data.item}
        error={data.error}
      />
    );
  },
);
