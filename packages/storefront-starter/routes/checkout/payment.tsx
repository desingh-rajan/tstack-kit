/**
 * Razorpay Payment Page
 * Handles the Razorpay checkout flow for both authenticated and guest users
 */

import { define } from "@/utils.ts";
// Per-request API client from middleware (ctx.state.api)
import { optionalAuth } from "@/lib/auth.ts";
import Navbar from "@/components/Navbar.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const { token, guestId } = optionalAuth(ctx);
    const api = ctx.state.api;

    const orderId = ctx.url.searchParams.get("orderId");
    const guestEmail = ctx.url.searchParams.get("email");

    if (!orderId) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/checkout" },
      });
    }

    // Determine if this is a guest checkout
    const isGuest = !token && !!guestEmail;

    // Require either token or guest email
    if (!token && !guestEmail) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/login?redirect=/checkout" },
      });
    }

    // Fetch order - different method for guests vs authenticated users
    let orderResponse;
    if (token) {
      api.setToken(token);
      orderResponse = await api.getOrder(orderId);
    } else if (guestEmail) {
      if (guestId) {
        api.setGuestId(guestId);
      }
      orderResponse = await api.getGuestOrderForPayment(orderId, guestEmail);
    }

    if (!orderResponse?.success || !orderResponse?.data) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/checkout?error=order-not-found" },
      });
    }

    const order = orderResponse.data;

    // Check if already paid
    if (order.paymentStatus === "paid") {
      if (isGuest) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/track-order?orderNumber=${order.orderNumber}&email=${
              encodeURIComponent(guestEmail!)
            }&success=true`,
          },
        });
      }
      return new Response(null, {
        status: 302,
        headers: { Location: `/orders/${orderId}?success=true` },
      });
    }

    // Create Razorpay order - use different methods for guests vs authenticated
    let paymentResponse;
    if (isGuest && guestEmail) {
      paymentResponse = await api.createGuestPaymentOrder(orderId, guestEmail);
    } else if (token) {
      api.setToken(token);
      paymentResponse = await api.createPaymentOrder(orderId);
    } else {
      return {
        data: {
          order,
          paymentOrder: null,
          error: "Authentication required",
          isGuest,
          guestEmail,
        },
      };
    }

    if (!paymentResponse.success || !paymentResponse.data) {
      return {
        data: {
          order,
          paymentOrder: null,
          error: paymentResponse.error || "Failed to create payment order",
          isGuest,
          guestEmail,
        },
      };
    }

    return {
      data: {
        order,
        paymentOrder: paymentResponse.data,
        error: null,
        isGuest,
        guestEmail,
      },
    };
  },
});

export default define.page<typeof handler>(function PaymentPage({
  data,
  state,
}) {
  const { order, paymentOrder, error, isGuest, guestEmail } = data;
  const user = state.user;

  // For guests, use the guest email and name from the order
  const prefillName = isGuest
    ? (order.shippingAddressSnapshot?.fullName || "")
    : (user?.fullName || "");
  const prefillEmail = isGuest ? (guestEmail || "") : (user?.email || "");
  const prefillPhone = isGuest
    ? (order.guestPhone || order.shippingAddressSnapshot?.phone || "")
    : (user?.phone || "");

  // Success redirect URL depends on user type
  const successUrl = isGuest
    ? `/track-order?orderNumber=${order.orderNumber}&email=${
      encodeURIComponent(guestEmail || "")
    }&success=true`
    : `/orders/${order.id}?success=true`;

  const errorUrl = isGuest
    ? `/track-order?orderNumber=${order.orderNumber}&email=${
      encodeURIComponent(guestEmail || "")
    }&error=verification-failed`
    : `/orders/${order.id}?error=verification-failed`;

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
      <Navbar
        minimal
        rightAction={<span class="text-gray-600">Secure Checkout</span>}
      />
      <div class="h-16"></div>

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
      {/* deno-lint-ignore react-no-danger */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.getElementById('pay-button').onclick = function(e) {
            e.preventDefault();
            
            var options = {
              key: "${paymentOrder.razorpayKeyId}",
              amount: ${paymentOrder.amount},
              currency: "${paymentOrder.currency}",
              name: "TStack Store",
              description: "Order ${order.orderNumber}",
              order_id: "${paymentOrder.razorpayOrderId}",
              image: "",
              prefill: {
                name: "${prefillName}",
                email: "${prefillEmail}",
                contact: "${prefillPhone}"
              },
              notes: {
                order_id: "${order.id}",
                order_number: "${order.orderNumber}"
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
                    orderId: "${order.id}",
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature${
            isGuest ? `,\n                    email: "${guestEmail}"` : ""
          }
                  })
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                  if (data.success) {
                    window.location.href = "${successUrl}";
                  } else {
                    alert("Payment verification failed. Please contact support.");
                    window.location.href = "${errorUrl}";
                  }
                })
                .catch(function() {
                  alert("Payment verification failed. Please contact support.");
                  window.location.href = "${errorUrl}";
                });
              },
              modal: {
                ondismiss: function() {
                  console.log("Payment modal closed by user");
                },
                escape: true,
                confirm_close: true
              }
            };
            
            var rzp = new Razorpay(options);
            rzp.on('payment.failed', function(response) {
              console.error("Payment failed:", response.error);
              alert("Oops! Something went wrong.\\n" + response.error.description);
            });
            rzp.open();
          };
        `,
        }}
      />
    </div>
  );
});
