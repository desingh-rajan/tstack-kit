/**
 * Razorpay Payment Page
 * Handles the Razorpay checkout flow
 */

import { define } from "@/utils.ts";
import { api } from "@/lib/api.ts";
import { requireAuth } from "@/lib/auth.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const token = requireAuth(ctx, "/checkout");
    if (token instanceof Response) return token;

    const orderId = ctx.url.searchParams.get("orderId");
    if (!orderId) {
      return ctx.redirect("/checkout");
    }

    api.setToken(token);

    // Get order details
    const orderResponse = await api.getOrder(orderId);
    if (!orderResponse.success || !orderResponse.data) {
      return ctx.redirect("/checkout?error=order-not-found");
    }

    const order = orderResponse.data;

    // Check if already paid
    if (order.paymentStatus === "paid") {
      return ctx.redirect(`/orders/${orderId}?success=true`);
    }

    // Create Razorpay order
    const paymentResponse = await api.createPaymentOrder(orderId);
    if (!paymentResponse.success || !paymentResponse.data) {
      return ctx.render({
        order,
        paymentOrder: null,
        error: paymentResponse.error || "Failed to create payment order",
      });
    }

    return ctx.render({
      order,
      paymentOrder: paymentResponse.data,
      error: null,
    });
  },
});

export default define.page<typeof handler>(function PaymentPage({
  data,
  state,
}) {
  const { order, paymentOrder, error } = data;
  const user = state.user;

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  if (error || !paymentOrder) {
    return (
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="max-w-md w-full bg-white shadow-sm rounded-lg p-8 text-center">
          <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg
              class="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">
            Payment Error
          </h2>
          <p class="text-gray-600 mb-6">
            {error || "Unable to process payment"}
          </p>
          <a
            href="/checkout"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Checkout
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Header */}
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <a href="/" class="text-xl font-bold text-indigo-600">
              Store
            </a>
            <span class="text-gray-600">Secure Checkout</span>
          </div>
        </div>
      </header>

      <main class="max-w-lg mx-auto px-4 py-16">
        <div class="bg-white shadow-sm rounded-lg p-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-6 text-center">
            Complete Payment
          </h1>

          <div class="border-b border-gray-200 pb-6 mb-6">
            <div class="flex justify-between mb-2">
              <span class="text-gray-600">Order Number</span>
              <span class="font-medium">{order.orderNumber}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Amount</span>
              <span class="text-xl font-bold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="pay-button"
            class="w-full py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Pay with Razorpay
          </button>

          <p class="mt-4 text-center text-sm text-gray-500">
            Secured by Razorpay
          </p>
        </div>

        <div class="mt-6 text-center">
          <a
            href="/checkout"
            class="text-sm text-gray-600 hover:text-indigo-600"
          >
            Cancel and return to checkout
          </a>
        </div>
      </main>

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.getElementById('pay-button').onclick = function(e) {
            e.preventDefault();
            
            var options = {
              key: "${paymentOrder.keyId}",
              amount: ${paymentOrder.amount},
              currency: "${paymentOrder.currency}",
              name: "TS Mart",
              description: "Order ${order.orderNumber}",
              order_id: "${paymentOrder.razorpayOrderId}",
              prefill: {
                name: "${user?.fullName || ""}",
                email: "${user?.email || ""}",
                contact: "${user?.phone || ""}"
              },
              theme: {
                color: "#4F46E5"
              },
              handler: function(response) {
                // Send verification to backend
                fetch("/api/payments/verify", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature
                  })
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                  if (data.success) {
                    window.location.href = "/orders/${order.id}?success=true";
                  } else {
                    alert("Payment verification failed. Please contact support.");
                    window.location.href = "/orders/${order.id}?error=verification-failed";
                  }
                })
                .catch(function(err) {
                  alert("Payment verification failed. Please contact support.");
                  window.location.href = "/orders/${order.id}?error=verification-failed";
                });
              },
              modal: {
                ondismiss: function() {
                  // User closed the modal
                }
              }
            };
            
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) {
              alert("Payment failed: " + response.error.description);
            });
            rzp.open();
          };
        `,
        }}
      />
    </div>
  );
});
