/**
 * Order Entity Configuration
 */

import type { EntityConfig } from "@/lib/admin/types.ts";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/entities/orders/order.types.ts";
import { orderService } from "@/entities/orders/order.service.ts";
import { formatCurrency } from "@/lib/currency.ts";
import { formatDateTime } from "@/lib/date.ts";

// Status badge colors
const statusColors: Record<OrderStatus, string> = {
  pending: "badge-warning",
  confirmed: "badge-info",
  processing: "badge-primary",
  shipped: "badge-secondary",
  delivered: "badge-success",
  cancelled: "badge-error",
  refunded: "badge-ghost",
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: "badge-warning",
  paid: "badge-success",
  failed: "badge-error",
  refunded: "badge-ghost",
};

export const orderConfig: EntityConfig<Order> = {
  name: "orders",
  singularName: "Order",
  pluralName: "Orders",
  apiPath: "/ts-admin/orders",
  idField: "id",

  displayField: "orderNumber",
  descriptionField: "totalAmount",

  // Orders are read-only in list - no create/delete from admin
  canCreate: false,
  canDelete: false,

  service: orderService as unknown as EntityConfig<Order>["service"],

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
      name: "orderNumber",
      label: "Order #",
      type: "string",
      showInList: true,
      showInShow: true,
      showInForm: false,
      sortable: true,
      searchable: true,
      render: (value, record) => (
        <a
          href={`/admin/orders/${(record as unknown as Order).id}`}
          class="font-mono font-semibold text-primary hover:underline"
        >
          {value as string}
        </a>
      ),
    },
    {
      name: "isGuest",
      label: "Customer",
      type: "custom",
      showInList: true,
      showInShow: true,
      showInForm: false,
      render: (_value, record) => {
        const order = record as unknown as Order;
        if (order.isGuest) {
          return (
            <div class="flex items-center gap-2">
              <span class="badge badge-ghost badge-sm">Guest</span>
              <div class="text-sm">
                <div class="font-medium">{order.guestEmail}</div>
                {order.guestPhone && (
                  <div class="text-xs text-base-content/60">
                    {order.guestPhone}
                  </div>
                )}
              </div>
            </div>
          );
        }
        if (order.user) {
          return (
            <div class="text-sm">
              <div class="font-medium">{order.user.email}</div>
            </div>
          );
        }
        return <span class="text-base-content/50">N/A</span>;
      },
    },
    {
      name: "status",
      label: "Status",
      type: "custom",
      showInList: true,
      showInShow: true,
      showInForm: false,
      render: (value) => {
        const status = value as OrderStatus;
        return (
          <span class={`badge ${statusColors[status] || "badge-ghost"}`}>
            {status}
          </span>
        );
      },
    },
    {
      name: "paymentStatus",
      label: "Payment",
      type: "custom",
      showInList: true,
      showInShow: true,
      showInForm: false,
      render: (value) => {
        const status = value as PaymentStatus;
        return (
          <span class={`badge ${paymentStatusColors[status] || "badge-ghost"}`}>
            {status}
          </span>
        );
      },
    },
    {
      name: "totalAmount",
      label: "Total",
      type: "custom",
      showInList: true,
      showInShow: true,
      showInForm: false,
      sortable: true,
      render: (value) => (
        <span class="font-semibold">
          {formatCurrency(value as string)}
        </span>
      ),
    },
    {
      name: "itemCount",
      label: "Items",
      type: "number",
      showInList: true,
      showInShow: false,
      showInForm: false,
    },
    {
      name: "paymentMethod",
      label: "Payment Method",
      type: "custom",
      showInList: false,
      showInShow: true,
      showInForm: false,
      render: (value) => (
        <span class="capitalize">{(value as string) || "N/A"}</span>
      ),
    },
    {
      name: "shippingAddress",
      label: "Shipping Address",
      type: "custom",
      showInList: false,
      showInShow: true,
      showInForm: false,
      render: (value) => {
        const addr = value as Order["shippingAddress"];
        if (!addr) return <span class="text-base-content/50">No address</span>;
        return (
          <div class="text-sm">
            <div class="font-semibold">{addr.fullName}</div>
            <div>{addr.addressLine1}</div>
            {addr.addressLine2 && <div>{addr.addressLine2}</div>}
            <div>
              {addr.city}, {addr.state} {addr.postalCode}
            </div>
            <div>{addr.country}</div>
            <div class="text-base-content/60">{addr.phone}</div>
          </div>
        );
      },
    },
    {
      name: "subtotal",
      label: "Subtotal",
      type: "custom",
      showInList: false,
      showInShow: true,
      showInForm: false,
      render: (value) => formatCurrency(value as string),
    },
    {
      name: "taxAmount",
      label: "Tax (GST)",
      type: "custom",
      showInList: false,
      showInShow: true,
      showInForm: false,
      render: (value) => formatCurrency(value as string),
    },
    {
      name: "shippingAmount",
      label: "Shipping",
      type: "custom",
      showInList: false,
      showInShow: true,
      showInForm: false,
      render: (value) => {
        const amount = parseFloat(value as string);
        if (amount === 0) {
          return <span class="text-success font-semibold">FREE</span>;
        }
        return formatCurrency(amount);
      },
    },
    {
      name: "customerNotes",
      label: "Customer Notes",
      type: "text",
      showInList: false,
      showInShow: true,
      showInForm: false,
    },
    {
      name: "adminNotes",
      label: "Admin Notes",
      type: "textarea",
      showInList: false,
      showInShow: true,
      showInForm: true,
    },
    {
      name: "createdAt",
      label: "Order Date",
      type: "custom",
      showInList: true,
      showInShow: true,
      showInForm: false,
      sortable: true,
      render: (value) => {
        return (
          <span>
            {formatDateTime(value as string, {
              hour: undefined,
              minute: undefined,
            })}
          </span>
        );
      },
    },
  ],

  // Default sort by newest orders
  defaultSort: { field: "createdAt", direction: "desc" },

  // Filters for order list
  filters: [
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "", label: "All Statuses" },
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
        { value: "refunded", label: "Refunded" },
      ],
    },
    {
      name: "paymentStatus",
      label: "Payment Status",
      type: "select",
      options: [
        { value: "", label: "All Payment Statuses" },
        { value: "pending", label: "Pending" },
        { value: "paid", label: "Paid" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
      ],
    },
    {
      name: "isGuest",
      label: "Customer Type",
      type: "select",
      options: [
        { value: "", label: "All Customers" },
        { value: "true", label: "Guest Orders" },
        { value: "false", label: "Registered Users" },
      ],
    },
  ],
};
