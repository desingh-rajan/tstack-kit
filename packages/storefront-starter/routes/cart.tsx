/**
 * Cart Page
 * Supports both authenticated users and guest users
 */

import { define } from "@/utils.ts";
import { optionalAuth } from "@/lib/auth.ts";
import Navbar from "@/components/Navbar.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const { token, guestId } = optionalAuth(ctx);
    const api = ctx.state.api;

    if (token) {
      api.setToken(token);
    } else if (guestId) {
      api.setGuestId(guestId);
    }

    const cartResponse = await api.getCart();

    return {
      data: {
        cart: cartResponse.data || null,
        error: cartResponse.success ? null : cartResponse.error,
        user: ctx.state.user,
        isGuest: !token,
      },
    };
  },

  async POST(ctx) {
    const { token, guestId } = optionalAuth(ctx);
    const api = ctx.state.api;

    if (token) {
      api.setToken(token);
    } else if (guestId) {
      api.setGuestId(guestId);
    }

    const formData = await ctx.req.formData();
    const action = formData.get("action") as string;

    let error = null;

    try {
      switch (action) {
        case "update": {
          const itemId = formData.get("itemId") as string;
          const quantity = parseInt(formData.get("quantity") as string);
          if (itemId && quantity > 0) {
            const result = await api.updateCartItem(itemId, quantity);
            if (!result.success) error = result.error;
          }
          break;
        }
        case "remove": {
          const itemId = formData.get("itemId") as string;
          if (itemId) {
            const result = await api.removeCartItem(itemId);
            if (!result.success) error = result.error;
          }
          break;
        }
        case "clear": {
          const result = await api.clearCart();
          if (!result.success) error = result.error;
          break;
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "An error occurred";
    }

    // Reload cart
    const cartResponse = await api.getCart();

    return {
      data: {
        cart: cartResponse.data || null,
        error: error || (cartResponse.success ? null : cartResponse.error),
        user: ctx.state.user,
        isGuest: !token,
      },
    };
  },
});

export default define.page<typeof handler>(function CartPage({ data }) {
  const { cart, error, user } = data;

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <div class="min-h-screen bg-gray-50">
      <Navbar user={user} cartCount={cart?.itemCount} />
      <div class="h-16"></div>

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {error && (
          <div class="rounded-md bg-red-50 p-4 mb-6">
            <p class="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {isEmpty
          ? (
            <div class="text-center py-16">
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
                Your cart is empty
              </h2>
              <p class="mt-2 text-gray-600">
                Start shopping to add items to your cart.
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
            <div class="lg:grid lg:grid-cols-12 lg:gap-x-12">
              {/* Cart Items */}
              <div class="lg:col-span-8">
                <div class="bg-white shadow-sm rounded-lg">
                  <ul class="divide-y divide-gray-200">
                    {cart.items.map((item) => (
                      <li key={item.id} class="p-6">
                        <div class="flex items-center">
                          {/* Product Image */}
                          <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                            {item.product.images?.[0]?.url
                              ? (
                                <img
                                  src={item.product.images[0].url}
                                  alt={item.product.name}
                                  class="h-full w-full object-cover object-center"
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

                          {/* Product Details */}
                          <div class="ml-6 flex-1">
                            <div class="flex justify-between">
                              <div>
                                <h3 class="text-lg font-medium text-gray-900">
                                  <a
                                    href={`/products/${item.product.slug}`}
                                    class="hover:text-indigo-600"
                                  >
                                    {item.product.name}
                                  </a>
                                </h3>
                                {item.variant && (
                                  <p class="mt-1 text-sm text-gray-500">
                                    {item.variant.name}
                                  </p>
                                )}
                              </div>
                              <p class="text-lg font-medium text-gray-900">
                                {formatCurrency(
                                  item.variant?.price || item.product.price,
                                )}
                              </p>
                            </div>

                            {/* Quantity and Remove */}
                            <div class="mt-4 flex items-center justify-between">
                              <form method="POST" class="flex items-center">
                                <input
                                  type="hidden"
                                  name="action"
                                  value="update"
                                />
                                <input
                                  type="hidden"
                                  name="itemId"
                                  value={item.id}
                                />
                                <label for={`qty-${item.id}`} class="sr-only">
                                  Quantity
                                </label>
                                <select
                                  id={`qty-${item.id}`}
                                  name="quantity"
                                  value={item.quantity}
                                  onChange="this.form.submit()"
                                  class="rounded-md border border-gray-300 py-1.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <option
                                      key={n}
                                      value={n}
                                      selected={n === item.quantity}
                                    >
                                      {n}
                                    </option>
                                  ))}
                                </select>
                                <noscript>
                                  <button
                                    type="submit"
                                    class="ml-2 text-sm text-indigo-600 hover:text-indigo-500"
                                  >
                                    Update
                                  </button>
                                </noscript>
                              </form>

                              <form method="POST">
                                <input
                                  type="hidden"
                                  name="action"
                                  value="remove"
                                />
                                <input
                                  type="hidden"
                                  name="itemId"
                                  value={item.id}
                                />
                                <button
                                  type="submit"
                                  class="text-sm font-medium text-red-600 hover:text-red-500"
                                >
                                  Remove
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Clear Cart */}
                <form method="POST" class="mt-4">
                  <input type="hidden" name="action" value="clear" />
                  <button
                    type="submit"
                    class="text-sm text-gray-600 hover:text-red-600"
                  >
                    Clear cart
                  </button>
                </form>
              </div>

              {/* Order Summary */}
              <div class="lg:col-span-4 mt-8 lg:mt-0">
                <div class="bg-white shadow-sm rounded-lg p-6">
                  <h2 class="text-lg font-medium text-gray-900">
                    Order Summary
                  </h2>

                  <div class="mt-6 space-y-4">
                    <div class="flex items-center justify-between">
                      <p class="text-gray-600">
                        Subtotal ({cart.itemCount} items)
                      </p>
                      <p class="font-medium text-gray-900">
                        {formatCurrency(cart.subtotal)}
                      </p>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-gray-600">Shipping</p>
                      <p class="text-gray-600">Calculated at checkout</p>
                    </div>
                    <div class="flex items-center justify-between">
                      <p class="text-gray-600">Tax</p>
                      <p class="text-gray-600">Calculated at checkout</p>
                    </div>
                  </div>

                  <div class="mt-6 border-t border-gray-200 pt-6">
                    <div class="flex items-center justify-between">
                      <p class="text-lg font-medium text-gray-900">Subtotal</p>
                      <p class="text-lg font-medium text-gray-900">
                        {formatCurrency(cart.subtotal)}
                      </p>
                    </div>
                  </div>

                  <div class="mt-6">
                    <a
                      href="/checkout"
                      class="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Proceed to Checkout
                    </a>
                  </div>

                  <div class="mt-4 text-center">
                    <a
                      href="/products"
                      class="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Continue Shopping
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
});
