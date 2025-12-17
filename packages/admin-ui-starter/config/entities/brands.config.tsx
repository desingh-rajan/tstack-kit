/**
 * Brand Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { Brand } from "@/entities/brands/brand.types.ts";
import { brandService } from "@/entities/brands/brand.service.ts";

export const brandConfig: EntityConfig<Brand> = {
  name: "brands",
  singularName: "Brand",
  pluralName: "Brands",
  apiPath: "/ts-admin/brands",
  idField: "id",

  displayField: "name",
  descriptionField: "slug",

  service: brandService,

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
      placeholder: "Enter brand name",
    },
    {
      name: "slug",
      label: "Slug",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "brand-url-slug",
      helpText: "URL-friendly version of the name (auto-generated if empty)",
    },
    {
      name: "logoUrl",
      label: "Logo URL",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: true,
      placeholder: "https://example.com/logo.png",
    },
    {
      name: "websiteUrl",
      label: "Website",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: true,
      placeholder: "https://brand-website.com",
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      showInList: false,
      showInShow: true,
      showInForm: true,
      rows: 3,
      placeholder: "Brief description of the brand",
    },
    {
      name: "isActive",
      label: "Status",
      type: "boolean",
      showInList: true,
      showInShow: true,
      showInForm: true,
      render: (value) => {
        const isActive = Boolean(value);
        return (
          <span class={`badge ${isActive ? "badge-success" : "badge-warning"}`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      name: "createdAt",
      label: "Created At",
      type: "datetime",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "updatedAt",
      label: "Updated At",
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
