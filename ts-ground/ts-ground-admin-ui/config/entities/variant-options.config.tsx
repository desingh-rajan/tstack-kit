/**
 * Variant Option Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { VariantOption } from "@/entities/variant_options/variant-option.types.ts";
import { variantOptionService } from "@/entities/variant_options/variant-option.service.ts";

export const variantOptionConfig: EntityConfig<VariantOption> = {
  name: "variant-options",
  singularName: "Variant Option",
  pluralName: "Variant Options",
  apiPath: "/ts-admin/variant-options",
  idField: "id",

  displayField: "name",
  descriptionField: "type",

  service: variantOptionService,

  fields: [
    {
      name: "id",
      label: "ID",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "name",
      label: "Name",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      searchable: true,
      placeholder: "e.g., 10 inch, Red, Pre-seasoned",
    },
    {
      name: "type",
      label: "Type",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      searchable: true,
      placeholder: "e.g., size, color, finish",
      helpText: "Category of variant: size, color, finish, material, etc.",
    },
    {
      name: "displayOrder",
      label: "Display Order",
      type: "number",
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
    },
    {
      name: "createdAt",
      label: "Created At",
      type: "datetime",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
  ],

  canCreate: true,
  canEdit: true,
  canDelete: true,
  canView: true,
};
