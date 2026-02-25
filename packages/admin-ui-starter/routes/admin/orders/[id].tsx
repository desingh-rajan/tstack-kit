/**
 * Order Detail Page
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { AccessDenied } from "@/components/admin/AccessDenied.tsx";
import { getSessionToken } from "@/lib/auth.ts";
import { orderService } from "@/entities/orders/order.service.ts";
import type {
  OrderStatus,
  PaymentStatus,
} from "@/entities/orders/order.types.ts";

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

// Valid status transitions
const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export const handler = define.handlers({
  async GET(ctx) {
    const token = getSessionToken(ctx);
    if (!token) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth/login?redirect=/admin/orders" },
      });
    }

    const { id } = ctx.params;
    orderService.setToken(token);

    try {
      const response = await orderService.getById(id);

      // Handle API response structure variations
      const orderData = response.data?.data || response.data;

      return {
        data: {
          order: orderData,
          error: null,
          errorStatus: null,
          success: null,
        },
      };
    } catch (error) {
      console.error("Error loading order:", error);
      const err = error as { status?: number; message?: string };
      return {
        data: {
          order: null,
          error: err.message || "Failed to load order",
          errorStatus: err.status || 500,
          success: null,
        },
      };
    }
  },

  async POST(ctx) {
    const token = getSessionToken(ctx);
    if (!token) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth/login?redirect=/admin/orders" },
      });
    }

    const { id } = ctx.params;
    orderService.setToken(token);

    const formData = await ctx.req.formData();
    const newStatus = formData.get("status") as OrderStatus;
    const adminNotes = formData.get("adminNotes") as string;

    try {
      await orderService.updateStatus(id, {
        status: newStatus,
        adminNotes: adminNotes || undefined,
      });

      // Reload order
      const response = await orderService.getById(id);
      const orderData = response.data?.data || response.data;

      return {
        data: {
          order: orderData,
          error: null,
          errorStatus: null,
          success: `Order status updated to "${newStatus}"`,
        },
      };
    } catch (error) {
      const err = error as { status?: number; message?: string };

      // Try to reload order even on error
      let order = null;
      try {
        const response = await orderService.getById(id);
        order = response.data?.data || response.data;
      } catch {
        // Ignore
      }

      return {
        data: {
          order,
          error: err.message || "Failed to update order status",
          errorStatus: err.status || 500,
          success: null,
        },
      };
    }
  },
});

export default define.page<typeof handler>(function OrderDetailPage({ data }) {
  const { order, error, errorStatus, success } = data;

  if (errorStatus === 403) {
    return (
      <AdminLayout currentPath="/admin/orders">
        <AccessDenied
          message={error || "You don't have permission to view this order"}
          entityName="Order"
        />
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout currentPath="/admin/orders">
        <div class="alert alert-error">
          <span>{error || "Order not found"}</span>
        </div>
        <a href="/admin/orders" class="btn btn-ghost mt-4">
          Back to Orders
        </a>
      </AdminLayout>
    );
  }

  const formatCurrency = (amount: string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(parseFloat(amount));

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const availableTransitions = statusTransitions[order.status] || [];

  return (
    <AdminLayout currentPath="/admin/orders">
      <div class="space-y-6">
        {/* Header */}
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2">
              <a href="/admin/orders" class="btn btn-ghost btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </a>
            </div>
            <h1 class="text-3xl font-bold mt-2">
              Order {order.orderNumber}
            </h1>
            <p class="text-base-content/60 mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div class="flex gap-2">
            <span class={`badge badge-lg ${statusColors[order.status]}`}>
              {order.status}
            </span>
            <span
              class={`badge badge-lg ${
                paymentStatusColors[order.paymentStatus]
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div class="alert alert-success">
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div class="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h2 class="card-title">Order Items</h2>
                <div class="overflow-x-auto">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items?.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div class="flex items-center gap-3">
                              {item.productImage
                                ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    class="w-12 h-12 object-cover rounded"
                                  />
                                )
                                : (
                                  <div class="w-12 h-12 bg-base-200 rounded flex items-center justify-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      class="w-6 h-6 text-base-content/40"
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
                                )}
                              <div>
                                <div class="font-semibold">
                                  {item.productName}
                                </div>
                                {item.variantName && (
                                  <div class="text-sm text-base-content/60">
                                    {item.variantName}
                                  </div>
                                )}
                                {item.sku && (
                                  <div class="text-xs text-base-content/40 font-mono">
                                    SKU: {item.sku}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td class="font-semibold">
                            {formatCurrency(item.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div class="divider"></div>
                <div class="flex justify-end">
                  <div class="w-64 space-y-2">
                    <div class="flex justify-between">
                      <span class="text-base-content/60">Subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-base-content/60">Shipping</span>
                      <span>
                        {parseFloat(order.shippingAmount) === 0
                          ? <span class="text-success">FREE</span>
                          : (
                            formatCurrency(order.shippingAmount)
                          )}
                      </span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-base-content/60">Tax</span>
                      <span>{formatCurrency(order.taxAmount)}</span>
                    </div>
                    {parseFloat(order.discountAmount) > 0 && (
                      <div class="flex justify-between text-success">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.discountAmount)}</span>
                      </div>
                    )}
                    <div class="divider my-1"></div>
                    <div class="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h2 class="card-title">
                  Customer
                  {order.isGuest && (
                    <span class="badge badge-ghost badge-sm">Guest</span>
                  )}
                </h2>
                <div class="space-y-1">
                  {order.isGuest
                    ? (
                      <>
                        <div class="font-semibold">Guest User</div>
                        {order.guestEmail && (
                          <div class="text-sm text-base-content/70">
                            {order.guestEmail}
                          </div>
                        )}
                        {order.guestPhone && (
                          <div class="text-sm text-base-content/70">
                            {order.guestPhone}
                          </div>
                        )}
                      </>
                    )
                    : order.user
                    ? (
                      <>
                        <div class="font-semibold">
                          {order.user.name || "Registered User"}
                        </div>
                        <div class="text-sm text-base-content/70">
                          {order.user.email}
                        </div>
                        {order.user.phone && (
                          <div class="text-sm text-base-content/70">
                            {order.user.phone}
                          </div>
                        )}
                      </>
                    )
                    : <div class="text-sm text-base-content/60">Unknown</div>}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {(order.shippingAddress || order.shippingAddressSnapshot) &&
              (() => {
                const addr = order.shippingAddress ||
                  order.shippingAddressSnapshot;
                return (
                  <div class="card bg-base-100 shadow">
                    <div class="card-body">
                      <h2 class="card-title">Shipping Address</h2>
                      <div>
                        <div class="font-semibold">{addr.fullName}</div>
                        <div>{addr.addressLine1}</div>
                        {addr.addressLine2 && <div>{addr.addressLine2}</div>}
                        <div>
                          {addr.city}, {addr.state} {addr.postalCode}
                        </div>
                        <div>{addr.country}</div>
                        {addr.phone && (
                          <div class="text-base-content/60 mt-2">
                            Phone: {addr.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>

          {/* Sidebar */}
          <div class="space-y-6">
            {/* Update Status */}
            {availableTransitions.length > 0 && (
              <div class="card bg-base-100 shadow">
                <div class="card-body">
                  <h2 class="card-title">Update Status</h2>
                  <form method="POST" class="space-y-4">
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">New Status</span>
                      </label>
                      <select
                        name="status"
                        class="select select-bordered w-full"
                        required
                      >
                        {availableTransitions.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div class="form-control">
                      <label class="label">
                        <span class="label-text">Admin Notes (optional)</span>
                      </label>
                      <textarea
                        name="adminNotes"
                        class="textarea textarea-bordered w-full"
                        rows={3}
                        placeholder="Add notes about this status change..."
                      >
                        {order.adminNotes || ""}
                      </textarea>
                    </div>
                    <button type="submit" class="btn btn-primary w-full">
                      Update Status
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h2 class="card-title">Payment Info</h2>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Method</span>
                    <span class="capitalize">
                      {order.paymentMethod || "N/A"}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-base-content/60">Status</span>
                    <span
                      class={`badge ${
                        paymentStatusColors[order.paymentStatus]
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  {order.razorpayOrderId && (
                    <div class="flex justify-between">
                      <span class="text-base-content/60">Razorpay Order</span>
                      <span class="font-mono text-xs">
                        {order.razorpayOrderId}
                      </span>
                    </div>
                  )}
                  {order.razorpayPaymentId && (
                    <div class="flex justify-between">
                      <span class="text-base-content/60">Payment ID</span>
                      <span class="font-mono text-xs">
                        {order.razorpayPaymentId}
                      </span>
                    </div>
                  )}
                </div>

                {/* Refund button for paid orders */}
                {order.paymentStatus === "paid" &&
                  order.status !== "refunded" && (
                  <div class="mt-4">
                    <a
                      href={`/admin/orders/${order.id}/refund`}
                      class="btn btn-outline btn-error btn-sm w-full"
                    >
                      Process Refund
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Notes */}
            {order.customerNotes && (
              <div class="card bg-base-100 shadow">
                <div class="card-body">
                  <h2 class="card-title">Customer Notes</h2>
                  <p class="text-sm">{order.customerNotes}</p>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {order.adminNotes && (
              <div class="card bg-warning/10 shadow">
                <div class="card-body">
                  <h2 class="card-title">Admin Notes</h2>
                  <p class="text-sm whitespace-pre-wrap">{order.adminNotes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
});
