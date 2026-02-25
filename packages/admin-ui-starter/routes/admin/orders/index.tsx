/**
 * Orders List Page
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import Pagination from "@/islands/Pagination.tsx";
import { AccessDenied } from "@/components/admin/AccessDenied.tsx";
import { getSessionToken } from "@/lib/auth.ts";
import { orderService } from "@/entities/orders/order.service.ts";
import type {
  Order,
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

export const handler = define.handlers({
  async GET(ctx) {
    const token = getSessionToken(ctx);
    if (!token) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/auth/login?redirect=/admin/orders" },
      });
    }

    orderService.setToken(token);

    const url = new URL(ctx.req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const status = url.searchParams.get("status") || undefined;
    const paymentStatus = url.searchParams.get("paymentStatus") || undefined;
    const search = url.searchParams.get("search") || undefined;

    try {
      const response = await orderService.list({
        page,
        limit: 10,
        status,
        paymentStatus,
        search,
      });

      // API returns { success, data: { orders, pagination } }
      const ordersData = response.data?.orders || [];
      const paginationData = response.data?.pagination || null;

      return {
        data: {
          orders: ordersData,
          pagination: paginationData,
          filters: { status, paymentStatus, search },
          error: null,
          errorStatus: null,
          url: url.toString(),
        },
      };
    } catch (error) {
      console.error("[Orders] Error:", error);
      const err = error as { status?: number; message?: string };
      return {
        data: {
          orders: [],
          pagination: null,
          filters: { status, paymentStatus, search },
          error: err.message || "Failed to load orders",
          errorStatus: err.status || 500,
          url: url.toString(),
        },
      };
    }
  },
});

export default define.page<typeof handler>(function OrdersListPage({ data }) {
  const { orders, pagination, filters, error, errorStatus, url } = data;
  const currentParams = url ? new URL(url).search : undefined;

  if (errorStatus === 403) {
    return (
      <AdminLayout currentPath="/admin/orders">
        <AccessDenied
          message={error || "You don't have permission to view orders"}
          entityName="Orders"
        />
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
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AdminLayout currentPath="/admin/orders">
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold">Orders</h1>
            <p class="text-base-content/60 mt-1">
              Manage customer orders
            </p>
          </div>
        </div>

        {/* Filters */}
        <div class="card bg-base-100 shadow">
          <div class="card-body py-4">
            <form method="GET" class="flex flex-wrap gap-4 items-end">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Search</span>
                </label>
                <input
                  type="text"
                  name="search"
                  placeholder="Order #, email..."
                  value={filters.search || ""}
                  class="input input-bordered input-sm w-48"
                />
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Status</span>
                </label>
                <select
                  name="status"
                  class="select select-bordered select-sm"
                  value={filters.status || ""}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Payment</span>
                </label>
                <select
                  name="paymentStatus"
                  class="select select-bordered select-sm"
                  value={filters.paymentStatus || ""}
                >
                  <option value="">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary btn-sm">
                Filter
              </button>
              <a href="/admin/orders" class="btn btn-ghost btn-sm">
                Clear
              </a>
            </form>
          </div>
        </div>

        {error && (
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Orders Table */}
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0
                    ? (
                      <tr>
                        <td
                          colSpan={8}
                          class="text-center py-8 text-base-content/60"
                        >
                          No orders found
                        </td>
                      </tr>
                    )
                    : (
                      orders.map((order: Order) => (
                        <tr key={order.id}>
                          <td>
                            <span class="font-mono font-semibold text-primary">
                              {order.orderNumber}
                            </span>
                          </td>
                          <td class="text-sm">{formatDate(order.createdAt)}</td>
                          <td>
                            <div class="text-sm">
                              {order.isGuest
                                ? (
                                  <>
                                    <span class="badge badge-ghost badge-xs mr-1">
                                      Guest
                                    </span>
                                    {order.guestEmail || "Guest"}
                                  </>
                                )
                                : (order.user?.email ||
                                  (order.userId
                                    ? `User #${order.userId}`
                                    : "N/A"))}
                            </div>
                          </td>
                          <td>{order.itemCount || "-"}</td>
                          <td class="font-semibold">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td>
                            <span
                              class={`badge ${
                                statusColors[order.status] || "badge-ghost"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <span
                              class={`badge ${
                                paymentStatusColors[order.paymentStatus] ||
                                "badge-ghost"
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <a
                              href={`/admin/orders/${order.id}`}
                              class="btn btn-ghost btn-xs"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                </tbody>
              </table>
            </div>

            {pagination && (
              <Pagination
                pagination={pagination}
                basePath="/admin/orders"
                currentParams={currentParams}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
});
