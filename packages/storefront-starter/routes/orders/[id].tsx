/**
 * Order Detail Page
 */

import { define } from "@/utils.ts";
import { api, type OrderStatus, type PaymentStatus } from "@/lib/api.ts";
import { requireAuth } from "@/lib/auth.ts";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export const handler = define.handlers({
  async GET(ctx) {
    const token = requireAuth(ctx, `/orders/${ctx.params.id}`);
    if (token instanceof Response) return token;

    api.setToken(token);
    const response = await api.getOrder(ctx.params.id);

    const success = ctx.url.searchParams.get("success") === "true";

    if (!response.success || !response.data) {
      return {
        data: {
          order: null,
          error: response.error || "Order not found",
          success: false,
        },
      };
    }

    return {
      data: {
        order: response.data,
        error: null,
        success,
      },
    };
  },

  async POST(ctx) {
    const token = requireAuth(ctx, `/orders/${ctx.params.id}`);
    if (token instanceof Response) return token;

    api.setToken(token);
    const formData = await ctx.req.formData();
    const action = formData.get("action") as string;

    if (action === "cancel") {
      const cancelResponse = await api.cancelOrder(ctx.params.id);
      if (!cancelResponse.success) {
        const response = await api.getOrder(ctx.params.id);
        return {
          data: {
            order: response.data,
            error: cancelResponse.error || "Failed to cancel order",
            success: false,
          },
        };
      }

      return {
        data: {
          order: cancelResponse.data,
          error: null,
          success: false,
        },
      };
    }

    const response = await api.getOrder(ctx.params.id);
    return {
      data: {
        order: response.data,
        error: null,
        success: false,
      },
    };
  },
});

export default define.page<typeof handler>(function OrderDetailPage({ data }) {
  const { order, error, success } = data;

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!order) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p class="text-gray-600 mb-6">{error || "Unable to load order"}</p>
          <a
            href="/account/orders"
            class="text-indigo-600 hover:text-indigo-500"
          >
            Back to Orders
          </a>
        </div>
      </div>
    );
  }

  const canCancel = order.status === "pending" &&
    order.paymentStatus !== "paid";

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <a href="/" class="text-xl font-bold text-indigo-600">
              Store
            </a>
            <nav class="flex items-center space-x-4">
              <a href="/account" class="text-gray-600 hover:text-indigo-600">
                Account
              </a>
              <a
                href="/auth/logout"
                class="text-gray-600 hover:text-indigo-600"
              >
                Logout
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-6">
          <a
            href="/account/orders"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to Orders
          </a>
        </div>

        {/* Success Banner */}
        {success && (
          <div class="rounded-md bg-green-50 p-4 mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  Order placed successfully!
                </h3>
                <p class="mt-1 text-sm text-green-700">
                  Thank you for your order. We'll send you updates on your order
                  status.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div class="rounded-md bg-red-50 p-4 mb-6">
            <p class="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Order Header */}
        <div class="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">
                Order {order.orderNumber}
              </h1>
              <p class="text-gray-600 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <div class="flex gap-2">
                <span
                  class={`px-3 py-1 text-sm font-medium rounded-full ${
                    statusColors[order.status]
                  }`}
                >
                  {order.status}
                </span>
                <span
                  class={`px-3 py-1 text-sm font-medium rounded-full ${
                    paymentStatusColors[order.paymentStatus]
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              {/* Complete Payment Button */}
              {order.status === "pending" &&
                order.paymentStatus === "pending" &&
                order.paymentMethod === "razorpay" && (
                <a
                  href={`/checkout/payment?orderId=${order.id}`}
                  class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Complete Payment
                </a>
              )}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div class="lg:col-span-2">
            <div class="bg-white shadow-sm rounded-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-medium text-gray-900">Order Items</h2>
              </div>
              <ul class="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <li key={item.id} class="p-6 flex">
                    <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      {item.productImage
                        ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            class="h-full w-full object-cover"
                          />
                        )
                        : (
                          <div class="h-full w-full bg-gray-100 flex items-center justify-center">
                            <svg
                              class="h-8 w-8 text-gray-400"
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
                    </div>
                    <div class="ml-6 flex-1">
                      <div class="flex justify-between">
                        <div>
                          <h3 class="text-base font-medium text-gray-900">
                            {item.productName}
                          </h3>
                          {item.variantName && (
                            <p class="text-sm text-gray-500">
                              {item.variantName}
                            </p>
                          )}
                          {item.sku && (
                            <p class="text-xs text-gray-400 mt-1">
                              SKU: {item.sku}
                            </p>
                          )}
                        </div>
                        <p class="text-base font-medium text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </p>
                      </div>
                      <div class="mt-2 flex justify-between">
                        <p class="text-sm text-gray-500">
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Shipping</span>
                    <span>
                      {parseFloat(order.shippingAmount) === 0
                        ? "FREE"
                        : formatCurrency(order.shippingAmount)}
                    </span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Tax</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                  </div>
                  {parseFloat(order.discountAmount) > 0 && (
                    <div class="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div class="flex justify-between text-lg font-medium pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div class="space-y-6">
            {/* Shipping Address */}
            <div class="bg-white shadow-sm rounded-lg p-6">
              <h2 class="text-lg font-medium text-gray-900 mb-4">
                Shipping Address
              </h2>
              {order.shippingAddressSnapshot && (
                <div class="text-sm text-gray-600">
                  <p class="font-medium text-gray-900">
                    {order.shippingAddressSnapshot.fullName}
                  </p>
                  <p>{order.shippingAddressSnapshot.addressLine1}</p>
                  {order.shippingAddressSnapshot.addressLine2 && (
                    <p>{order.shippingAddressSnapshot.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddressSnapshot.city},{" "}
                    {order.shippingAddressSnapshot.state}{" "}
                    {order.shippingAddressSnapshot.postalCode}
                  </p>
                  <p>{order.shippingAddressSnapshot.country}</p>
                  <p class="mt-2">
                    Phone: {order.shippingAddressSnapshot.phone}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div class="bg-white shadow-sm rounded-lg p-6">
              <h2 class="text-lg font-medium text-gray-900 mb-4">
                Payment Info
              </h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Method</span>
                  <span class="capitalize">
                    {order.paymentMethod === "razorpay"
                      ? "Online Payment"
                      : "Cash on Delivery"}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Status</span>
                  <span
                    class={`px-2 py-1 text-xs font-medium rounded-full ${
                      paymentStatusColors[order.paymentStatus]
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel Order */}
            {canCancel && (
              <div class="bg-white shadow-sm rounded-lg p-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Actions</h2>
                <form method="POST">
                  <input type="hidden" name="action" value="cancel" />
                  <button
                    type="submit"
                    class="w-full px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
                    onClick="return confirm('Are you sure you want to cancel this order?')"
                  >
                    Cancel Order
                  </button>
                </form>
              </div>
            )}

            {/* Customer Notes */}
            {order.customerNotes && (
              <div class="bg-white shadow-sm rounded-lg p-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                  Your Notes
                </h2>
                <p class="text-sm text-gray-600">{order.customerNotes}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
});
