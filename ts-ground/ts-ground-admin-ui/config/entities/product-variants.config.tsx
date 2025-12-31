/**
 * Product Variant Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { ProductVariant } from "@/entities/product_variants/product-variant.types.ts";
import { productVariantService } from "@/entities/product_variants/product-variant.service.ts";

export const productVariantConfig: EntityConfig<ProductVariant> = {
  name: "product-variants",
  singularName: "Product Variant",
  pluralName: "Product Variants",
  apiPath: "/ts-admin/product-variants",
  idField: "id",

  displayField: "sku",
  descriptionField: "productId",

  service: productVariantService,

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
      name: "productId",
      label: "Product ID",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
    },
    {
      name: "sku",
      label: "SKU",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: true,
      searchable: true,
      placeholder: "Variant SKU code",
    },
    {
      name: "options",
      label: "Options",
      type: "json",
      showInList: true,
      showInShow: true,
      showInForm: true,
      render: (value) => {
        const options = value as Record<string, string> || {};
        const entries = Object.entries(options);
        if (entries.length === 0) {
          return <span class="text-base-content/40">-</span>;
        }
        return (
          <div class="flex flex-wrap gap-1">
            {entries.map(([key, val]) => (
              <span key={key} class="badge badge-outline badge-sm">
                {key}: {val}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      name: "price",
      label: "Price",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
      placeholder: "Leave empty to use product base price",
      render: (value) => {
        if (!value) return <span class="text-base-content/40">Base price</span>;
        const price = parseFloat(String(value));
        return <span class="font-mono">Rs. {price.toFixed(2)}</span>;
      },
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
