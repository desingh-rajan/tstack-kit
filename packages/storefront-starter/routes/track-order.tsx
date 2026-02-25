/**
 * Order Tracking Page
 * Public page for tracking orders by order number and email
 * Used primarily for guest checkout order confirmation and tracking
 */

import { define } from "@/utils.ts";
import type { TrackOrderResponse } from "@/lib/api.ts";
import Navbar from "@/components/Navbar.tsx";

interface TrackOrderData {
  order: TrackOrderResponse | null;
  error: string | null;
  orderNumber: string;
  email: string;
  success: boolean;
}

export const handler = define.handlers({
  async GET(ctx) {
    const orderNumber = ctx.url.searchParams.get("orderNumber") || "";
    const email = ctx.url.searchParams.get("email") || "";
    const success = ctx.url.searchParams.get("success") === "true";
    const api = ctx.state.api;

    // If both params provided, auto-track
    if (orderNumber && email) {
      const result = await api.trackOrder(orderNumber, email);

      return {
        data: {
          order: result.data || null,
          error: result.success ? null : (result.error || "Order not found"),
          orderNumber,
          email,
          success,
        },
      };
    }

    return {
      data: {
        order: null,
        error: null,
        orderNumber,
        email,
        success: false,
      },
    };
  },

  async POST(ctx) {
    const formData = await ctx.req.formData();
    const orderNumber = (formData.get("orderNumber") as string || "").trim();
    const email = (formData.get("email") as string || "").trim();
    const api = ctx.state.api;

    if (!orderNumber || !email) {
      return {
        data: {
          order: null,
          error: "Please enter both order number and email address",
          orderNumber,
          email,
          success: false,
        },
      };
    }

    const result = await api.trackOrder(orderNumber, email);

    return {
      data: {
        order: result.data || null,
        error: result.success ? null : (result.error || "Order not found"),
        orderNumber,
        email,
        success: false,
      },
    };
  },
});

export default define.page<typeof handler>(function TrackOrderPage({ data }) {
  const { order, error, orderNumber, email, success } = data;

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };

  const paymentStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };

  return (
    <div class="min-h-screen bg-gray-50">
      <Navbar />
      <div class="h-16"></div>

      <main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Track Your Order</h1>

        {/* Success Message */}
        {success && order && (
          <div class="rounded-md bg-green-50 p-4 mb-6">
            <div class="flex">
              <svg
                class="h-5 w-5 text-green-400 mr-3 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <div>
                <h3 class="text-sm font-medium text-green-800">
                  Order placed successfully!
                </h3>
                <p class="mt-1 text-sm text-green-700">
                  Your order <strong>{order.orderNumber}</strong>{" "}
                  has been confirmed. A confirmation email has been sent to{" "}
                  <strong>{email}</strong>.
                </p>
                <p class="mt-2 text-sm text-green-700">
                  Bookmark this page to track your order status.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Track Order Form */}
        {!order && (
          <div class="bg-white shadow-sm rounded-lg p-6 mb-8">
            <p class="text-gray-600 mb-4">
              Enter your order number and email address to track your order.
            </p>

            {error && (
              <div class="rounded-md bg-red-50 p-4 mb-4">
                <p class="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <form method="POST" class="space-y-4">
              <div>
                <label
                  for="orderNumber"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Order Number
                </label>
                <input
                  type="text"
                  id="orderNumber"
                  name="orderNumber"
                  value={orderNumber}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. ORD-20250101-ABCD"
                />
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="your@email.com"
                />
              </div>

              <button
                type="submit"
                class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              >
                Track Order
              </button>
            </form>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div class="space-y-6">
            {/* Order Header */}
            <div class="bg-white shadow-sm rounded-lg p-6">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 class="text-lg font-medium text-gray-900">
                    Order {order.orderNumber}
                  </h2>
                  <p class="text-sm text-gray-500 mt-1">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div class="mt-4 sm:mt-0 flex gap-2">
                  <span
                    class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[order.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                  <span
                    class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      paymentStatusColors[order.paymentStatus] ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    Payment: {order.paymentStatus.charAt(0).toUpperCase() +
                      order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              <div class="mt-4 border-t border-gray-200 pt-4">
                <div class="flex justify-between">
                  <span class="text-gray-600">Total Amount</span>
                  <span class="text-lg font-bold text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                {order.paymentMethod && (
                  <div class="flex justify-between mt-1">
                    <span class="text-sm text-gray-500">Payment Method</span>
                    <span class="text-sm text-gray-600">
                      {order.paymentMethod === "razorpay"
                        ? "Online Payment"
                        : order.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : order.paymentMethod}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div class="bg-white shadow-sm rounded-lg p-6">
                <h3 class="text-sm font-medium text-gray-900 mb-3">
                  Shipping Address
                </h3>
                <div class="text-sm text-gray-600">
                  <p class="font-medium text-gray-900">
                    {order.shippingAddress.fullName}
                  </p>
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p>{order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                    {" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p class="mt-1">Phone: {order.shippingAddress.phone}</p>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div class="bg-white shadow-sm rounded-lg p-6">
              <h3 class="text-sm font-medium text-gray-900 mb-3">
                Order Items
              </h3>
              <ul class="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <li key={item.id} class="py-3 flex justify-between">
                    <div class="flex items-center">
                      {item.productImage && (
                        <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 mr-3">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            class="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p class="text-xs text-gray-500">
                            {item.variantName}
                          </p>
                        )}
                        <p class="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p class="text-sm font-medium text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Track Again */}
            <div class="text-center">
              <a
                href="/track-order"
                class="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Track a different order
              </a>
              <span class="mx-2 text-gray-300">|</span>
              <a
                href="/products"
                class="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Continue Shopping
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
});
