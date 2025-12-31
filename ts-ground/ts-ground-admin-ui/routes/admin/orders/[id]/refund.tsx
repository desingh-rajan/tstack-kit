/**
 * Process Refund Page
 */

import { define } from "@/utils.ts";
import { AdminLayout } from "@/components/layout/AdminLayout.tsx";
import { AccessDenied } from "@/components/admin/AccessDenied.tsx";
import { getSessionToken } from "@/lib/auth.ts";
import { orderService } from "@/entities/orders/order.service.ts";
import { paymentService } from "@/entities/payments/payment.service.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const token = await getSessionToken(ctx);
    if (!token) {
      return ctx.redirect("/auth/login?redirect=/admin/orders");
    }

    const { id } = ctx.params;
    orderService.setToken(token);

    try {
      const response = await orderService.getById(id);
      const order = response.data;

      // Validate order can be refunded
      if (order.paymentStatus !== "paid") {
        return ctx.render({
          order,
          error: "Only paid orders can be refunded",
          errorStatus: 400,
        });
      }

      if (order.status === "refunded") {
        return ctx.render({
          order,
          error: "This order has already been refunded",
          errorStatus: 400,
        });
      }

      return ctx.render({
        order,
        error: null,
        errorStatus: null,
      });
    } catch (error) {
      const err = error as { status?: number; message?: string };
      return ctx.render({
        order: null,
        error: err.message || "Failed to load order",
        errorStatus: err.status || 500,
      });
    }
  },

  async POST(ctx) {
    const token = await getSessionToken(ctx);
    if (!token) {
      return ctx.redirect("/auth/login?redirect=/admin/orders");
    }

    const { id } = ctx.params;
    orderService.setToken(token);
    paymentService.setToken(token);

    const formData = await ctx.req.formData();
    const reason = formData.get("reason") as string;
    const partialAmount = formData.get("partialAmount") as string;

    try {
      // Get order to get orderId
      const orderResponse = await orderService.getById(id);
      const order = orderResponse.data;

      // Process refund
      const refundData: { reason: string; amount?: number } = {
        reason: reason || "Admin initiated refund",
      };

      if (partialAmount && parseFloat(partialAmount) > 0) {
        refundData.amount = parseFloat(partialAmount);
      }

      await paymentService.refund(order.id, refundData);

      // Redirect to order detail with success
      return ctx.redirect(`/admin/orders/${id}?success=refund`);
    } catch (error) {
      const err = error as { status?: number; message?: string };

      // Try to reload order
      let order = null;
      try {
        const response = await orderService.getById(id);
        order = response.data;
      } catch {
        // Ignore
      }

      return ctx.render({
        order,
        error: err.message || "Failed to process refund",
        errorStatus: err.status || 500,
      });
    }
  },
});

export default define.page<typeof handler>(function RefundPage({ data }) {
  const { order, error, errorStatus } = data;

  if (errorStatus === 403) {
    return (
      <AdminLayout currentPath="/admin/orders">
        <AccessDenied
          message={error || "You don't have permission to process refunds"}
          entityName="Refund"
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

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const canRefund = order.paymentStatus === "paid" &&
    order.status !== "refunded";

  return (
    <AdminLayout currentPath="/admin/orders">
      <div class="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div class="flex items-center gap-2">
            <a href={`/admin/orders/${order.id}`} class="btn btn-ghost btn-sm">
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
              Back to Order
            </a>
          </div>
          <h1 class="text-3xl font-bold mt-2">Process Refund</h1>
          <p class="text-base-content/60 mt-1">
            Order {order.orderNumber}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div class="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Order Summary */}
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Order Summary</h2>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/60">Order Total</span>
                <span class="font-bold">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Payment Status</span>
                <span class="badge badge-success">{order.paymentStatus}</span>
              </div>
              {order.razorpayPaymentId && (
                <div class="flex justify-between">
                  <span class="text-base-content/60">Razorpay Payment</span>
                  <span class="font-mono text-xs">
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Refund Form */}
        {canRefund
          ? (
            <div class="card bg-base-100 shadow">
              <div class="card-body">
                <h2 class="card-title text-error">Refund Details</h2>

                <div class="alert alert-warning mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-6 w-6 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>
                    This action cannot be undone. The refund will be processed
                    through Razorpay and the order status will be updated to
                    "refunded".
                  </span>
                </div>

                <form method="POST" class="space-y-4">
                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">Refund Reason *</span>
                    </label>
                    <select
                      name="reason"
                      class="select select-bordered w-full"
                      required
                    >
                      <option value="">Select a reason</option>
                      <option value="Customer request">Customer request</option>
                      <option value="Product damaged">Product damaged</option>
                      <option value="Wrong item shipped">
                        Wrong item shipped
                      </option>
                      <option value="Item not delivered">
                        Item not delivered
                      </option>
                      <option value="Quality issue">Quality issue</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div class="form-control">
                    <label class="label">
                      <span class="label-text">
                        Partial Refund Amount (optional)
                      </span>
                    </label>
                    <label class="input-group">
                      <span>INR</span>
                      <input
                        type="number"
                        name="partialAmount"
                        class="input input-bordered w-full"
                        placeholder={`Max: ${order.totalAmount}`}
                        min="0"
                        max={order.totalAmount}
                        step="0.01"
                      />
                    </label>
                    <label class="label">
                      <span class="label-text-alt">
                        Leave empty to refund the full amount (
                        {formatCurrency(order.totalAmount)})
                      </span>
                    </label>
                  </div>

                  <div class="flex gap-4 mt-6">
                    <a
                      href={`/admin/orders/${order.id}`}
                      class="btn btn-ghost flex-1"
                    >
                      Cancel
                    </a>
                    <button type="submit" class="btn btn-error flex-1">
                      Process Refund
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
          : (
            <div class="alert alert-info">
              <span>
                This order cannot be refunded. Only paid orders that have not
                been already refunded can be processed.
              </span>
            </div>
          )}
      </div>
    </AdminLayout>
  );
});
