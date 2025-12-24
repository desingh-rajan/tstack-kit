/**
 * Product Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { Product } from "@/entities/products/product.types.ts";
import { productService } from "@/entities/products/product.service.ts";

export const productConfig: EntityConfig<Product> = {
  name: "products",
  singularName: "Product",
  pluralName: "Products",
  apiPath: "/ts-admin/products",
  idField: "id",

  displayField: "name",
  descriptionField: "sku",

  service: productService,

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
      placeholder: "Enter product name",
    },
    {
      name: "slug",
      label: "Slug",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: true,
      placeholder: "product-url-slug",
      helpText: "URL-friendly version of the name (auto-generated if empty)",
    },
    {
      name: "sku",
      label: "SKU",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: true,
      searchable: true,
      placeholder: "Product SKU code",
    },
    {
      name: "price",
      label: "Price",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      placeholder: "0.00",
      render: (value) => {
        const price = parseFloat(String(value) || "0");
        return <span class="font-mono">Rs. {price.toFixed(2)}</span>;
      },
    },
    {
      name: "compareAtPrice",
      label: "Compare At Price",
      type: "string",
      showInList: false,
      showInShow: true,
      showInForm: true,
      placeholder: "Original price (for sales)",
      helpText: "Original price before discount",
    },
    {
      name: "stockQuantity",
      label: "Stock",
      type: "number",
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      render: (value) => {
        const qty = Number(value) || 0;
        const colorClass = qty > 10
          ? "text-success"
          : qty > 0
          ? "text-warning"
          : "text-error";
        return <span class={`font-mono ${colorClass}`}>{qty}</span>;
      },
    },
    {
      name: "brandId",
      label: "Brand",
      type: "relationship",
      relationship: {
        type: "belongsTo",
        entity: "brands",
        labelField: "name",
        searchable: true,
      },
      showInList: false,
      showInShow: true,
      showInForm: true,
      placeholder: "Select brand (optional)",
    },
    {
      name: "categoryId",
      label: "Category",
      type: "relationship",
      relationship: {
        type: "belongsTo",
        entity: "categories",
        labelField: "name",
        searchable: true,
      },
      showInList: false,
      showInShow: true,
      showInForm: true,
      placeholder: "Select category (optional)",
    },
    {
      name: "description",
      label: "Description",
      type: "text",
      showInList: false,
      showInShow: true,
      showInForm: true,
      rows: 5,
      placeholder: "Product description",
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
