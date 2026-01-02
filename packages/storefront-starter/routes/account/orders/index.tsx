/**
 * My Orders Page
 */

import { define } from "@/utils.ts";
import {
  api,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/api.ts";
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
    const token = requireAuth(ctx, "/account/orders");
    if (token instanceof Response) return token;

    try {
      api.setToken(token);
      const response = await api.getOrders();

      // API returns { orders: [...], pagination: {...} } or just an array
      let ordersData: Order[] = [];
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          ordersData = response.data;
        } else if (
          response.data.orders && Array.isArray(response.data.orders)
        ) {
          ordersData = response.data.orders;
        }
      }

      return {
        data: {
          orders: ordersData,
          error: response.success
            ? null
            : (response.error || "Failed to load orders"),
        },
      };
    } catch (error) {
      console.error("Error loading orders:", error);
      return {
        data: {
          orders: [],
          error: "Failed to load orders",
        },
      };
    }
  },
});

export default define.page<typeof handler>(function OrdersPage({ data }) {
  const { orders, error } = data;

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

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

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-6">
          <a
            href="/account"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to Account
          </a>
        </div>

        <h1 class="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

        {error && (
          <div class="rounded-md bg-red-50 p-4 mb-6">
            <p class="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {orders.length === 0
          ? (
            <div class="bg-white shadow-sm rounded-lg p-12 text-center">
              <svg
                class="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h2 class="mt-4 text-xl font-medium text-gray-900">
                No orders yet
              </h2>
              <p class="mt-2 text-gray-600">
                Start shopping to see your orders here.
              </p>
              <a
                href="/products"
                class="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Products
              </a>
            </div>
          )
          : (
            <div class="space-y-6">
              {orders.map((order: Order) => (
                <div
                  key={order.id}
                  class="bg-white shadow-sm rounded-lg overflow-hidden"
                >
                  {/* Order Header */}
                  <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                      <div class="flex flex-wrap items-center gap-4">
                        <div>
                          <p class="text-sm text-gray-500">Order Number</p>
                          <p class="font-medium text-gray-900">
                            {order.orderNumber}
                          </p>
                        </div>
                        <div>
                          <p class="text-sm text-gray-500">Order Date</p>
                          <p class="font-medium text-gray-900">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p class="text-sm text-gray-500">Total</p>
                          <p class="font-medium text-gray-900">
                            {formatCurrency(order.totalAmount)}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class={`px-3 py-1 text-xs font-medium rounded-full ${
                            statusColors[order.status]
                          }`}
                        >
                          {order.status}
                        </span>
                        <span
                          class={`px-3 py-1 text-xs font-medium rounded-full ${
                            paymentStatusColors[order.paymentStatus]
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div class="px-6 py-4">
                    <ul class="divide-y divide-gray-200">
                      {(order.items || []).slice(0, 3).map((item) => (
                        <li key={item.id} class="py-4 flex">
                          <div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
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
                          <div class="ml-4 flex-1">
                            <h3 class="text-sm font-medium text-gray-900">
                              {item.productName}
                            </h3>
                            {item.variantName && (
                              <p class="text-sm text-gray-500">
                                {item.variantName}
                              </p>
                            )}
                            <p class="text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>
                            <p class="text-sm font-medium text-gray-900">
                              {formatCurrency(item.totalPrice)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {(order.items || []).length > 3 && (
                      <p class="text-sm text-gray-500 mt-2">
                        +{(order.items || []).length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div class="flex justify-between items-center">
                      <a
                        href={`/orders/${order.id}`}
                        class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        View Order Details
                      </a>

                      {order.status === "pending" &&
                        order.paymentStatus === "pending" && (
                        <a
                          href={`/checkout/payment?orderId=${order.id}`}
                          class="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md"
                        >
                          Complete Payment
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </main>
    </div>
  );
});
