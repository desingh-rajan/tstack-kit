/**
 * Checkout Page
 */

import { define } from "@/utils.ts";
import { type Address, api, type Cart } from "@/lib/api.ts";
import { requireAuth } from "@/lib/auth.ts";
import Navbar from "@/components/Navbar.tsx";

interface CheckoutData {
  cart: Cart | null;
  addresses: Address[];
  error: string | null;
  step: "address" | "payment" | "review";
  selectedAddressId: string | null;
  paymentMethod: "razorpay" | "cod";
}

export const handler = define.handlers({
  async GET(ctx) {
    const token = requireAuth(ctx, "/checkout");
    if (token instanceof Response) return token;

    api.setToken(token);

    const [cartResponse, addressesResponse] = await Promise.all([
      api.getCart(),
      api.getAddresses(),
    ]);

    if (!cartResponse.success || !cartResponse.data?.items?.length) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/cart" },
      });
    }

    return {
      data: {
        cart: cartResponse.data,
        addresses: addressesResponse.data || [],
        error: null,
        step: "address",
        selectedAddressId: null,
        paymentMethod: "razorpay",
      },
    };
  },

  async POST(ctx) {
    const token = requireAuth(ctx, "/checkout");
    if (token instanceof Response) return token;

    api.setToken(token);

    const formData = await ctx.req.formData();
    const action = formData.get("action") as string;

    // Reload cart and addresses
    const [cartResponse, addressesResponse] = await Promise.all([
      api.getCart(),
      api.getAddresses(),
    ]);

    const cart = cartResponse.data;
    const addresses = addressesResponse.data || [];

    if (!cart?.items?.length) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/cart" },
      });
    }

    switch (action) {
      case "select-address": {
        const addressId = formData.get("addressId") as string;
        return {
          data: {
            cart,
            addresses,
            error: null,
            step: "payment",
            selectedAddressId: addressId,
            paymentMethod: "razorpay",
          },
        };
      }

      case "select-payment": {
        const addressId = formData.get("addressId") as string;
        const paymentMethod = formData.get("paymentMethod") as
          | "razorpay"
          | "cod";
        return {
          data: {
            cart,
            addresses,
            error: null,
            step: "review",
            selectedAddressId: addressId,
            paymentMethod,
          },
        };
      }

      case "place-order": {
        const addressId = formData.get("addressId") as string;
        const paymentMethod = formData.get("paymentMethod") as
          | "razorpay"
          | "cod";
        const customerNotes = formData.get("customerNotes") as string;

        // Create order
        const orderResponse = await api.createOrder({
          shippingAddressId: addressId,
          paymentMethod,
          customerNotes: customerNotes || undefined,
        });

        if (!orderResponse.success || !orderResponse.data) {
          return {
            data: {
              cart,
              addresses,
              error: orderResponse.error || "Failed to create order",
              step: "review",
              selectedAddressId: addressId,
              paymentMethod,
            },
          };
        }

        const order = orderResponse.data;

        if (paymentMethod === "cod") {
          // COD order - redirect to confirmation
          return new Response(null, {
            status: 302,
            headers: { Location: `/orders/${order.id}?success=true` },
          });
        }

        // Razorpay - redirect to payment page
        return new Response(null, {
          status: 302,
          headers: { Location: `/checkout/payment?orderId=${order.id}` },
        });
      }

      case "add-address": {
        // Redirect to add address page
        return new Response(null, {
          status: 302,
          headers: { Location: "/account/addresses/new?redirect=/checkout" },
        });
      }

      default:
        return {
          data: {
            cart,
            addresses,
            error: null,
            step: "address",
            selectedAddressId: null,
            paymentMethod: "razorpay",
          },
        };
    }
  },
});

export default define.page<typeof handler>(function CheckoutPage({ data }) {
  const { cart, addresses, error, step, selectedAddressId, paymentMethod } =
    data;

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Calculate totals
  const subtotal = parseFloat(cart?.subtotal || "0");
  const shipping = subtotal >= 500 ? 0 : 50;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div class="min-h-screen bg-gray-50">
      <Navbar
        minimal
        rightAction={
          <a href="/cart" class="text-gray-600 hover:text-indigo-600">
            Back to Cart
          </a>
        }
      />
      <div class="h-16"></div>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div class="mb-8">
          <nav class="flex items-center justify-center">
            <ol class="flex items-center space-x-8">
              {["address", "payment", "review"].map((s, i) => (
                <li key={s} class="flex items-center">
                  <span
                    class={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step === s
                        ? "bg-indigo-600 text-white"
                        : i < ["address", "payment", "review"].indexOf(step)
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    class={`ml-2 text-sm font-medium ${
                      step === s ? "text-indigo-600" : "text-gray-600"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {error && (
          <div class="rounded-md bg-red-50 p-4 mb-6">
            <p class="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <div class="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Main Content */}
          <div class="lg:col-span-8">
            {/* Address Selection */}
            {step === "address" && (
              <div class="bg-white shadow-sm rounded-lg p-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                  Shipping Address
                </h2>

                {addresses.length === 0
                  ? (
                    <div class="text-center py-8">
                      <p class="text-gray-600 mb-4">
                        You don't have any saved addresses.
                      </p>
                      <form method="POST">
                        <input
                          type="hidden"
                          name="action"
                          value="add-address"
                        />
                        <button
                          type="submit"
                          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Add New Address
                        </button>
                      </form>
                    </div>
                  )
                  : (
                    <form method="POST">
                      <input
                        type="hidden"
                        name="action"
                        value="select-address"
                      />
                      <div class="space-y-4">
                        {addresses.map((address) => (
                          <label
                            key={address.id}
                            class={`block p-4 border rounded-lg cursor-pointer hover:border-indigo-500 ${
                              address.isDefault
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200"
                            }`}
                          >
                            <input
                              type="radio"
                              name="addressId"
                              value={address.id}
                              checked={address.isDefault}
                              class="sr-only"
                            />
                            <div class="flex justify-between">
                              <div>
                                <p class="font-medium text-gray-900">
                                  {address.fullName}
                                  {address.isDefault && (
                                    <span class="ml-2 text-xs text-indigo-600">
                                      (Default)
                                    </span>
                                  )}
                                </p>
                                <p class="text-sm text-gray-600">
                                  {address.addressLine1}
                                </p>
                                {address.addressLine2 && (
                                  <p class="text-sm text-gray-600">
                                    {address.addressLine2}
                                  </p>
                                )}
                                <p class="text-sm text-gray-600">
                                  {address.city}, {address.state}{" "}
                                  {address.postalCode}
                                </p>
                                <p class="text-sm text-gray-600">
                                  {address.country}
                                </p>
                                <p class="text-sm text-gray-500 mt-1">
                                  Phone: {address.phone}
                                </p>
                              </div>
                              <div class="flex items-start">
                                <span class="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                  {address.isDefault && (
                                    <span class="w-3 h-3 rounded-full bg-indigo-600">
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div class="mt-6 flex justify-between">
                        <button
                          type="button"
                          onClick="document.querySelector('[name=action]').value='add-address';this.form.submit()"
                          class="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          + Add new address
                        </button>
                        <button
                          type="submit"
                          class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Continue to Payment
                        </button>
                      </div>
                    </form>
                  )}
              </div>
            )}

            {/* Payment Selection */}
            {step === "payment" && (
              <div class="bg-white shadow-sm rounded-lg p-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                  Payment Method
                </h2>

                <form method="POST">
                  <input type="hidden" name="action" value="select-payment" />
                  <input
                    type="hidden"
                    name="addressId"
                    value={selectedAddressId}
                  />

                  <div class="space-y-4">
                    <label class="block p-4 border rounded-lg cursor-pointer hover:border-indigo-500 border-indigo-500 bg-indigo-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked
                        class="sr-only"
                      />
                      <div class="flex items-center">
                        <div class="flex-1">
                          <p class="font-medium text-gray-900">
                            Pay Online (Razorpay)
                          </p>
                          <p class="text-sm text-gray-600">
                            UPI, Credit/Debit Card, Net Banking
                          </p>
                        </div>
                        <span class="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          <span class="w-3 h-3 rounded-full bg-indigo-600">
                          </span>
                        </span>
                      </div>
                    </label>

                    <label class="block p-4 border rounded-lg cursor-pointer hover:border-indigo-500">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        class="sr-only"
                      />
                      <div class="flex items-center">
                        <div class="flex-1">
                          <p class="font-medium text-gray-900">
                            Cash on Delivery
                          </p>
                          <p class="text-sm text-gray-600">
                            Pay when you receive your order
                          </p>
                        </div>
                        <span class="w-5 h-5 rounded-full border-2 border-gray-300">
                        </span>
                      </div>
                    </label>
                  </div>

                  <div class="mt-6 flex justify-between">
                    <a
                      href="/checkout"
                      class="text-sm text-gray-600 hover:text-indigo-600"
                    >
                      Back to Address
                    </a>
                    <button
                      type="submit"
                      class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Review Order
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Order Review */}
            {step === "review" && (
              <div class="space-y-6">
                {/* Shipping Address */}
                <div class="bg-white shadow-sm rounded-lg p-6">
                  <h2 class="text-lg font-medium text-gray-900 mb-4">
                    Shipping Address
                  </h2>
                  {selectedAddress && (
                    <div>
                      <p class="font-medium">{selectedAddress.fullName}</p>
                      <p class="text-gray-600">
                        {selectedAddress.addressLine1}
                      </p>
                      {selectedAddress.addressLine2 && (
                        <p class="text-gray-600">
                          {selectedAddress.addressLine2}
                        </p>
                      )}
                      <p class="text-gray-600">
                        {selectedAddress.city}, {selectedAddress.state}{" "}
                        {selectedAddress.postalCode}
                      </p>
                      <p class="text-gray-600">{selectedAddress.country}</p>
                      <p class="text-gray-500 mt-1">
                        Phone: {selectedAddress.phone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div class="bg-white shadow-sm rounded-lg p-6">
                  <h2 class="text-lg font-medium text-gray-900 mb-4">
                    Payment Method
                  </h2>
                  <p class="text-gray-600">
                    {paymentMethod === "razorpay"
                      ? "Pay Online (Razorpay)"
                      : "Cash on Delivery"}
                  </p>
                </div>

                {/* Order Items */}
                <div class="bg-white shadow-sm rounded-lg p-6">
                  <h2 class="text-lg font-medium text-gray-900 mb-4">
                    Order Items
                  </h2>
                  <ul class="divide-y divide-gray-200">
                    {cart?.items.map((item) => (
                      <li key={item.id} class="py-4 flex">
                        <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                          {item.product.images?.[0]?.url
                            ? (
                              <img
                                src={item.product.images[0].url}
                                alt={item.product.name}
                                class="h-full w-full object-cover"
                              />
                            )
                            : <div class="h-full w-full bg-gray-100"></div>}
                        </div>
                        <div class="ml-4 flex-1 flex flex-col">
                          <div class="flex justify-between">
                            <h3 class="text-sm font-medium text-gray-900">
                              {item.product.name}
                            </h3>
                            <p class="text-sm font-medium text-gray-900">
                              {formatCurrency(
                                item.variant?.price || item.product.price,
                              )}
                            </p>
                          </div>
                          {item.variant && (
                            <p class="text-sm text-gray-500">
                              {item.variant.name}
                            </p>
                          )}
                          <p class="text-sm text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Place Order */}
                <form method="POST">
                  <input type="hidden" name="action" value="place-order" />
                  <input
                    type="hidden"
                    name="addressId"
                    value={selectedAddressId}
                  />
                  <input
                    type="hidden"
                    name="paymentMethod"
                    value={paymentMethod}
                  />

                  <div class="bg-white shadow-sm rounded-lg p-6">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Order Notes (optional)
                    </label>
                    <textarea
                      name="customerNotes"
                      rows={3}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Any special instructions for your order..."
                    >
                    </textarea>
                  </div>

                  <div class="mt-6 flex justify-between">
                    <a
                      href="/checkout"
                      class="text-sm text-gray-600 hover:text-indigo-600"
                    >
                      Back to start
                    </a>
                    <button
                      type="submit"
                      class="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {paymentMethod === "razorpay"
                        ? "Proceed to Payment"
                        : "Place Order"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div class="lg:col-span-4 mt-8 lg:mt-0">
            <div class="bg-white shadow-sm rounded-lg p-6 sticky top-8">
              <h2 class="text-lg font-medium text-gray-900 mb-4">
                Order Summary
              </h2>

              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">
                    Subtotal ({cart?.itemCount} items)
                  </span>
                  <span class="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Shipping</span>
                  <span class="font-medium">
                    {shipping === 0
                      ? <span class="text-green-600">FREE</span>
                      : (
                        formatCurrency(shipping)
                      )}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Tax (GST 18%)</span>
                  <span class="font-medium">{formatCurrency(tax)}</span>
                </div>
              </div>

              <div class="border-t border-gray-200 mt-4 pt-4">
                <div class="flex justify-between">
                  <span class="text-lg font-medium text-gray-900">Total</span>
                  <span class="text-lg font-medium text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {shipping === 0 && (
                <p class="mt-4 text-sm text-green-600">
                  You qualify for free shipping!
                </p>
              )}
              {shipping > 0 && (
                <p class="mt-4 text-sm text-gray-500">
                  Add {formatCurrency(500 - subtotal)} more for free shipping
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});
