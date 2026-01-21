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
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "Select brand (optional)",
      // Custom render using populated brand object from API
      render: (_value, record) => {
        const brand = record?.brand as { id?: string; name?: string } | null;
        if (brand?.id && brand?.name) {
          return (
            <a href={`/admin/brands/${brand.id}`} class="link link-primary">
              {brand.name}
            </a>
          );
        }
        return <span class="text-base-content/50">-</span>;
      },
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
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "Select category (optional)",
      // Custom render using populated category object from API
      render: (_value, record) => {
        const category = record?.category as
          | { id?: string; name?: string }
          | null;
        if (category?.id && category?.name) {
          return (
            <a
              href={`/admin/categories/${category.id}`}
              class="link link-primary"
            >
              {category.name}
            </a>
          );
        }
        return <span class="text-base-content/50">-</span>;
      },
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
    // Images field - uses standard "image" type for automatic handling
    // ShowPage renders this as read-only gallery
    // Edit page renders this as ImageUploadPane (see edit.tsx template)
    {
      name: "images",
      label: "Product Images",
      type: "image",
      showInList: true,
      showInShow: true,
      showInForm: true, // Handled separately in edit.tsx, not in GenericForm
      imageConfig: {
        entityType: "products",
        entityIdField: "id",
        multiple: true,
        maxFiles: 10,
        maxSize: 5 * 1024 * 1024, // 5MB
        accept: "image/jpeg,image/png,image/webp,image/gif",
      },
      render: (value) => {
        const images = value as
          | Array<{
            url?: string;
            thumbnailUrl?: string | null;
            altText?: string | null;
          }>
          | null;
        const img = images?.[0];

        if (!img?.url) {
          return (
            <div class="w-10 h-10 bg-base-200 rounded flex items-center justify-center text-base-content/40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          );
        }
        return (
          <img
            src={img.thumbnailUrl || img.url}
            alt={img.altText || "Product"}
            class="w-10 h-10 object-cover rounded"
          />
        );
      },
    },
  ],

  canCreate: true,
  canEdit: true,
  canDelete: true,
  canView: true,
};
