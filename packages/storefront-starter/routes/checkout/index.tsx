/**
 * Checkout Page
 * Supports both authenticated users (with saved addresses) and guest checkout
 */

import { define } from "@/utils.ts";
import type { Address, Cart, GuestAddress } from "@/lib/api.ts";
import { optionalAuth } from "@/lib/auth.ts";
import Navbar from "@/components/Navbar.tsx";

interface CheckoutData {
  cart: Cart | null;
  addresses: Address[];
  error: string | null;
  step: "address" | "payment" | "review";
  selectedAddressId: string | null;
  paymentMethod: "razorpay" | "cod";
  isGuest: boolean;
  guestEmail: string;
  guestAddress: GuestAddress | null;
}

export const handler = define.handlers({
  async GET(ctx) {
    const { token, guestId } = optionalAuth(ctx);
    const isGuest = !token;
    const api = ctx.state.api;

    if (token) {
      api.setToken(token);
    } else if (guestId) {
      api.setGuestId(guestId);
    }

    // Fetch cart (always needed)
    const cartResponse = await api.getCart();

    // Fetch addresses only for authenticated users
    const addressesResponse = token ? await api.getAddresses() : { data: [] };

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
        isGuest,
        guestEmail: "",
        guestAddress: null,
      },
    };
  },

  async POST(ctx) {
    const { token, guestId } = optionalAuth(ctx);
    const isGuest = !token;
    const api = ctx.state.api;

    if (token) {
      api.setToken(token);
    } else if (guestId) {
      api.setGuestId(guestId);
    }

    const formData = await ctx.req.formData();
    const action = formData.get("action") as string;

    // Reload cart
    const cartResponse = await api.getCart();
    const addressesResponse = token ? await api.getAddresses() : { data: [] };

    const cart = cartResponse.data;
    const addresses = addressesResponse.data || [];

    if (!cart?.items?.length) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/cart" },
      });
    }

    // Parse guest state from hidden fields
    const savedGuestEmail = formData.get("guestEmail") as string || "";
    const guestAddressStr = formData.get("guestAddress") as string | null;
    let savedGuestAddress: GuestAddress | null = null;

    if (guestAddressStr) {
      try {
        savedGuestAddress = JSON.parse(guestAddressStr);
      } catch {
        // Invalid JSON, ignore
      }
    }

    const baseData = {
      cart,
      addresses,
      isGuest,
    };

    switch (action) {
      case "select-address": {
        const addressId = formData.get("addressId") as string;
        return {
          data: {
            ...baseData,
            error: null,
            step: "payment" as const,
            selectedAddressId: addressId,
            paymentMethod: "razorpay" as const,
            guestEmail: savedGuestEmail,
            guestAddress: savedGuestAddress,
          },
        };
      }

      case "guest-address": {
        const guestEmail = formData.get("guestEmail") as string;
        const shippingAddressStr = formData.get("shippingAddress") as string;

        // Validate email
        if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
          return {
            data: {
              ...baseData,
              error: "Please enter a valid email address",
              step: "address" as const,
              selectedAddressId: null,
              paymentMethod: "razorpay" as const,
              guestEmail: guestEmail || "",
              guestAddress: savedGuestAddress,
            },
          };
        }

        let shippingAddress: GuestAddress;
        try {
          shippingAddress = JSON.parse(shippingAddressStr);
        } catch {
          return {
            data: {
              ...baseData,
              error: "Invalid address data",
              step: "address" as const,
              selectedAddressId: null,
              paymentMethod: "razorpay" as const,
              guestEmail,
              guestAddress: null,
            },
          };
        }

        // Validate required fields
        if (
          !shippingAddress.fullName || !shippingAddress.phone ||
          !shippingAddress.addressLine1 || !shippingAddress.city ||
          !shippingAddress.state || !shippingAddress.postalCode
        ) {
          return {
            data: {
              ...baseData,
              error: "Please fill in all required address fields",
              step: "address" as const,
              selectedAddressId: null,
              paymentMethod: "razorpay" as const,
              guestEmail,
              guestAddress: shippingAddress,
            },
          };
        }

        return {
          data: {
            ...baseData,
            error: null,
            step: "payment" as const,
            selectedAddressId: null,
            paymentMethod: "razorpay" as const,
            guestEmail,
            guestAddress: shippingAddress,
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
            ...baseData,
            error: null,
            step: "review" as const,
            selectedAddressId: addressId,
            paymentMethod,
            guestEmail: savedGuestEmail,
            guestAddress: savedGuestAddress,
          },
        };
      }

      case "place-order": {
        const addressId = formData.get("addressId") as string;
        const paymentMethod = formData.get("paymentMethod") as
          | "razorpay"
          | "cod";
        const customerNotes = formData.get("customerNotes") as string;

        let orderResponse;

        if (isGuest) {
          const guestEmail = formData.get("guestEmail") as string;
          const guestAddrStr = formData.get("guestAddress") as string;
          let guestAddress: GuestAddress;

          try {
            guestAddress = JSON.parse(guestAddrStr);
          } catch {
            return {
              data: {
                ...baseData,
                error: "Invalid address data",
                step: "review" as const,
                selectedAddressId: null,
                paymentMethod,
                guestEmail: "",
                guestAddress: null,
              },
            };
          }

          orderResponse = await api.createGuestOrder({
            guestEmail,
            shippingAddress: guestAddress,
            paymentMethod,
            customerNotes: customerNotes || undefined,
          });
        } else {
          orderResponse = await api.createOrder({
            shippingAddressId: addressId,
            paymentMethod,
            customerNotes: customerNotes || undefined,
          });
        }

        if (!orderResponse.success || !orderResponse.data) {
          return {
            data: {
              ...baseData,
              error: orderResponse.error || "Failed to create order",
              step: "review" as const,
              selectedAddressId: addressId,
              paymentMethod,
              guestEmail: savedGuestEmail,
              guestAddress: savedGuestAddress,
            },
          };
        }

        const order = orderResponse.data;

        if (paymentMethod === "cod") {
          if (isGuest) {
            return new Response(null, {
              status: 302,
              headers: {
                Location:
                  `/track-order?orderNumber=${order.orderNumber}&email=${
                    encodeURIComponent(savedGuestEmail)
                  }&success=true`,
              },
            });
          }
          return new Response(null, {
            status: 302,
            headers: { Location: `/orders/${order.id}?success=true` },
          });
        }

        // Razorpay - redirect to payment page
        if (isGuest) {
          return new Response(null, {
            status: 302,
            headers: {
              Location:
                `/checkout/payment?orderId=${order.id}&guest=true&email=${
                  encodeURIComponent(savedGuestEmail)
                }`,
            },
          });
        }
        return new Response(null, {
          status: 302,
          headers: { Location: `/checkout/payment?orderId=${order.id}` },
        });
      }

      case "add-address": {
        if (isGuest) {
          return {
            data: {
              ...baseData,
              error: null,
              step: "address" as const,
              selectedAddressId: null,
              paymentMethod: "razorpay" as const,
              guestEmail: savedGuestEmail,
              guestAddress: savedGuestAddress,
            },
          };
        }
        return new Response(null, {
          status: 302,
          headers: { Location: "/account/addresses/new?redirect=/checkout" },
        });
      }

      default:
        return {
          data: {
            ...baseData,
            error: null,
            step: "address" as const,
            selectedAddressId: null,
            paymentMethod: "razorpay" as const,
            guestEmail: savedGuestEmail,
            guestAddress: savedGuestAddress,
          },
        };
    }
  },
});

export default define.page<typeof handler>(function CheckoutPage({ data }) {
  const {
    cart,
    addresses,
    error,
    step,
    selectedAddressId,
    paymentMethod,
    isGuest,
    guestEmail,
    guestAddress,
  } = data;

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Calculate totals (customize thresholds/rates for your store)
  const subtotal = parseFloat(cart?.subtotal || "0");
  const freeShippingThreshold = 100;
  const shippingCost = 10;
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCost;
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
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

                {isGuest
                  ? (
                    <div>
                      <div class="mb-4 p-4 bg-blue-50 rounded-lg">
                        <p class="text-sm text-blue-700">
                          <span class="font-medium">
                            Checking out as guest.
                          </span>{" "}
                          <a
                            href="/auth/login?redirect=/checkout"
                            class="underline hover:text-blue-800"
                          >
                            Sign in
                          </a>{" "}
                          for faster checkout with saved addresses.
                        </p>
                      </div>

                      <GuestAddressFormInline
                        initialEmail={guestEmail}
                        initialAddress={guestAddress}
                      />
                    </div>
                  )
                  : addresses.length === 0
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
                          // @ts-ignore - Native onclick for server-rendered component
                          onClick="document.querySelector('[name=action]').value='add-address';this.form.submit()"
                          class="text-sm text-indigo-600 hover:text-indigo-500 cursor-pointer"
                        >
                          + Add new address
                        </button>
                        <button
                          type="submit"
                          class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
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
                    value={selectedAddressId ?? ""}
                  />
                  {isGuest && guestEmail && (
                    <input type="hidden" name="guestEmail" value={guestEmail} />
                  )}
                  {isGuest && guestAddress && (
                    <input
                      type="hidden"
                      name="guestAddress"
                      value={JSON.stringify(guestAddress)}
                    />
                  )}

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
                      class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
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
                  {isGuest && guestAddress
                    ? (
                      <div>
                        <p class="font-medium">{guestAddress.fullName}</p>
                        <p class="text-gray-600">
                          {guestAddress.addressLine1}
                        </p>
                        {guestAddress.addressLine2 && (
                          <p class="text-gray-600">
                            {guestAddress.addressLine2}
                          </p>
                        )}
                        <p class="text-gray-600">
                          {guestAddress.city}, {guestAddress.state}{" "}
                          {guestAddress.postalCode}
                        </p>
                        {guestAddress.country && (
                          <p class="text-gray-600">{guestAddress.country}</p>
                        )}
                        <p class="text-gray-500 mt-1">
                          Phone: {guestAddress.phone}
                        </p>
                        <p class="text-gray-500 mt-1">
                          Email: {guestEmail}
                        </p>
                      </div>
                    )
                    : selectedAddress && (
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
                <form method="POST" id="place-order-form">
                  <input type="hidden" name="action" value="place-order" />
                  <input
                    type="hidden"
                    name="addressId"
                    value={selectedAddressId ?? ""}
                  />
                  <input
                    type="hidden"
                    name="paymentMethod"
                    value={paymentMethod}
                  />
                  {isGuest && guestEmail && (
                    <input type="hidden" name="guestEmail" value={guestEmail} />
                  )}
                  {isGuest && guestAddress && (
                    <input
                      type="hidden"
                      name="guestAddress"
                      value={JSON.stringify(guestAddress)}
                    />
                  )}

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
                      id="place-order-btn"
                      class="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {paymentMethod === "razorpay"
                        ? "Proceed to Payment"
                        : "Place Order"}
                    </button>
                  </div>
                </form>
                {/* deno-lint-ignore react-no-danger */}
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                    (function() {
                      var form = document.getElementById('place-order-form');
                      var btn = document.getElementById('place-order-btn');
                      if (form && btn) {
                        form.addEventListener('submit', function(e) {
                          if (btn.disabled) {
                            e.preventDefault();
                            return false;
                          }
                          btn.disabled = true;
                          btn.textContent = 'Processing...';
                        });
                      }
                    })();
                  `,
                  }}
                />
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
                      : formatCurrency(shipping)}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">
                    Tax ({(taxRate * 100).toFixed(0)}%)
                  </span>
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
                  Add {formatCurrency(freeShippingThreshold - subtotal)}{" "}
                  more for free shipping
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

/**
 * Inline guest address form component (server-rendered, not an island)
 */
function GuestAddressFormInline(
  { initialEmail, initialAddress }: {
    initialEmail?: string;
    initialAddress?: GuestAddress | null;
  },
) {
  return (
    <form method="POST" id="guest-address-form">
      <input type="hidden" name="action" value="guest-address" />

      {/* Email */}
      <div class="mb-4">
        <label
          for="guestEmail"
          class="block text-sm font-medium text-gray-700 mb-1"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="guestEmail"
          name="guestEmail"
          value={initialEmail || ""}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="your@email.com"
        />
        <p class="mt-1 text-xs text-gray-500">
          Order confirmation will be sent to this email
        </p>
      </div>

      <h3 class="text-sm font-medium text-gray-900 mb-3">
        Shipping Address
      </h3>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label
            for="fullName"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={initialAddress?.fullName || ""}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div class="sm:col-span-2">
          <label
            for="phone"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Phone *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={initialAddress?.phone || ""}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div class="sm:col-span-2">
          <label
            for="addressLine1"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Address Line 1 *
          </label>
          <input
            type="text"
            id="addressLine1"
            name="addressLine1"
            value={initialAddress?.addressLine1 || ""}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div class="sm:col-span-2">
          <label
            for="addressLine2"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Address Line 2
          </label>
          <input
            type="text"
            id="addressLine2"
            name="addressLine2"
            value={initialAddress?.addressLine2 || ""}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            for="city"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            City *
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={initialAddress?.city || ""}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            for="state"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            State *
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={initialAddress?.state || ""}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            for="postalCode"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Postal Code *
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={initialAddress?.postalCode || ""}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            for="country"
            class="block text-sm font-medium text-gray-700 mb-1"
          >
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={initialAddress?.country || "US"}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Hidden field to serialize address as JSON for form submission */}
      <input type="hidden" name="shippingAddress" id="shippingAddressJson" />

      <div class="mt-6 flex justify-end">
        <button
          type="submit"
          class="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
        >
          Continue to Payment
        </button>
      </div>

      {/* Serialize address fields to JSON on submit */}
      {/* deno-lint-ignore react-no-danger */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          document.getElementById('guest-address-form').addEventListener('submit', function() {
            var addr = {
              fullName: document.getElementById('fullName').value,
              phone: document.getElementById('phone').value,
              addressLine1: document.getElementById('addressLine1').value,
              addressLine2: document.getElementById('addressLine2').value || undefined,
              city: document.getElementById('city').value,
              state: document.getElementById('state').value,
              postalCode: document.getElementById('postalCode').value,
              country: document.getElementById('country').value || 'US'
            };
            document.getElementById('shippingAddressJson').value = JSON.stringify(addr);
          });
        `,
        }}
      />
    </form>
  );
}
