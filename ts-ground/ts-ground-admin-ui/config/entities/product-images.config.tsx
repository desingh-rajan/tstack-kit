/**
 * Product Image Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type { ProductImage } from "@/entities/product_images/product-image.types.ts";
import { productImageService } from "@/entities/product_images/product-image.service.ts";

export const productImageConfig: EntityConfig<ProductImage> = {
  name: "product-images",
  singularName: "Product Image",
  pluralName: "Product Images",
  apiPath: "/ts-admin/product-images",
  idField: "id",

  displayField: "url",
  descriptionField: "altText",

  service: productImageService,

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
      name: "url",
      label: "Image URL",
      type: "string",
      required: true,
      showInList: true,
      showInShow: true,
      showInForm: true,
      render: (value) => {
        const url = String(value || "");
        return url
          ? (
            <img
              src={url}
              alt="Product"
              class="w-16 h-16 object-cover rounded"
            />
          )
          : <span class="text-base-content/40">No image</span>;
      },
    },
    {
      name: "altText",
      label: "Alt Text",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: true,
      placeholder: "Image description for accessibility",
    },
    {
      name: "displayOrder",
      label: "Order",
      type: "number",
      showInList: true,
      showInShow: true,
      showInForm: true,
      sortable: true,
    },
    {
      name: "isPrimary",
      label: "Primary",
      type: "boolean",
      showInList: true,
      showInShow: true,
      showInForm: true,
      render: (value) => {
        const isPrimary = Boolean(value);
        return isPrimary
          ? <span class="badge badge-primary">Primary</span>
          : null;
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
  ],

  canCreate: true,
  canEdit: true,
  canDelete: true,
  canView: true,
};
