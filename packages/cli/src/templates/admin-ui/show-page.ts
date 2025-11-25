import type { EntityNames } from "../../utils/stringUtils.ts";

export function generateShowPageTemplate(names: EntityNames): string {
  return `/**
 * ${names.pascalSingular} Show Page
 * Uses generic ShowPage component
 */

import { define } from "@/utils.ts";
import { ShowPage } from "@/components/admin/ShowPage.tsx";
import { createCRUDHandlers } from "@/lib/admin/crud-handlers.ts";
import { ${names.singular}Config } from "@/config/entities/${names.snakePlural}.config.tsx";

const handlers = createCRUDHandlers(${names.singular}Config);

export const handler = define.handlers({
  GET: handlers.show,
});

export default define.page<typeof handler>(function ${names.pascalSingular}ShowPageRoute({ data }) {
  return <ShowPage config={data.config} item={data.item} error={data.error} />;
});
`;
}
