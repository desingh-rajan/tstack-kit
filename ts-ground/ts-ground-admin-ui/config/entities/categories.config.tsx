/**
 * Category Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { Category } from "@/entities/categories/category.types.ts";
import { categoryService } from "@/entities/categories/category.service.ts";

export const categoryConfig: EntityConfig<Category> = {
  name: "categories",
  singularName: "Category",
  pluralName: "Categories",
  apiPath: "/ts-admin/categories",
  idField: "id",

  displayField: "name",
  descriptionField: "slug",

  service: categoryService,

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
      placeholder: "Enter category name",
    },
    {
      name: "slug",
      label: "Slug",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "category-url-slug",
      helpText: "URL-friendly version of the name (auto-generated if empty)",
    },
    {
      name: "parentId",
      label: "Parent Category",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "Select parent category (optional)",
      helpText: "Leave empty for top-level category",
    },
    {
      name: "icon",
      label: "Icon",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: true,
      placeholder: "Icon name or URL",
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      showInList: false,
      showInShow: true,
      showInForm: true,
      rows: 3,
      placeholder: "Brief description of the category",
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
