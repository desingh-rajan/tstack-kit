/**
 * Addresses List Page
 */

import { define } from "@/utils.ts";
import type { Address } from "@/lib/api.ts";
import { requireAuth } from "@/lib/auth.ts";
import Navbar from "@/components/Navbar.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const token = requireAuth(ctx, "/account/addresses");
    if (token instanceof Response) return token;

    const api = ctx.state.api;
    api.setToken(token);
    const response = await api.getAddresses();

    return {
      data: {
        addresses: response.data || [],
        error: response.success ? null : response.error,
        success: null,
      },
    };
  },

  async POST(ctx) {
    const token = requireAuth(ctx, "/account/addresses");
    if (token instanceof Response) return token;

    const api = ctx.state.api;
    api.setToken(token);
    const formData = await ctx.req.formData();
    const action = formData.get("action") as string;
    const addressId = formData.get("addressId") as string;

    let error = null;
    let successMsg = null;

    try {
      switch (action) {
        case "delete": {
          const result = await api.deleteAddress(addressId);
          if (!result.success) {
            error = result.error;
          } else {
            successMsg = "Address deleted successfully";
          }
          break;
        }
        case "set-default": {
          const result = await api.setDefaultAddress(addressId);
          if (!result.success) {
            error = result.error;
          } else {
            successMsg = "Default address updated";
          }
          break;
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "An error occurred";
    }

    const response = await api.getAddresses();

    return {
      data: {
        addresses: response.data || [],
        error,
        success: successMsg,
      },
    };
  },
});

export default define.page<typeof handler>(
  function AddressesPage({ data, url, state }) {
    const { addresses, error, success } = data;
    const redirect = url.searchParams.get("redirect");
    const user = state.user;

    return (
      <div class="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div class="h-16"></div>

        <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-6">
            <a
              href={redirect || "/account"}
              class="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {redirect ? "Back to Checkout" : "Back to Account"}
            </a>
          </div>

          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900">My Addresses</h1>
            <a
              href={`/account/addresses/new${
                redirect ? `?redirect=${redirect}` : ""
              }`}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add New Address
            </a>
          </div>

          {error && (
            <div class="rounded-md bg-red-50 p-4 mb-6">
              <p class="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div class="rounded-md bg-green-50 p-4 mb-6">
              <p class="text-sm font-medium text-green-800">{success}</p>
            </div>
          )}

          {addresses.length === 0
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <h2 class="mt-4 text-xl font-medium text-gray-900">
                  No addresses saved
                </h2>
                <p class="mt-2 text-gray-600">
                  Add a shipping address for faster checkout.
                </p>
                <a
                  href={`/account/addresses/new${
                    redirect ? `?redirect=${redirect}` : ""
                  }`}
                  class="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Address
                </a>
              </div>
            )
            : (
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {addresses.map((address: Address) => (
                  <div
                    key={address.id}
                    class={`bg-white shadow-sm rounded-lg p-6 relative ${
                      address.isDefault ? "ring-2 ring-indigo-500" : ""
                    }`}
                  >
                    {address.isDefault && (
                      <span class="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                        Default
                      </span>
                    )}

                    <h3 class="font-medium text-gray-900">
                      {address.fullName}
                    </h3>
                    <div class="mt-2 text-sm text-gray-600">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}, {address.state} {address.postalCode}
                      </p>
                      <p>{address.country}</p>
                      <p class="mt-2">Phone: {address.phone}</p>
                    </div>

                    <div class="mt-4 flex gap-4">
                      <a
                        href={`/account/addresses/${address.id}/edit`}
                        class="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Edit
                      </a>

                      {!address.isDefault && (
                        <form method="POST" class="inline">
                          <input
                            type="hidden"
                            name="action"
                            value="set-default"
                          />
                          <input
                            type="hidden"
                            name="addressId"
                            value={address.id}
                          />
                          <button
                            type="submit"
                            class="text-sm text-gray-600 hover:text-gray-500"
                          >
                            Set as Default
                          </button>
                        </form>
                      )}

                      <form method="POST" class="inline">
                        <input type="hidden" name="action" value="delete" />
                        <input
                          type="hidden"
                          name="addressId"
                          value={address.id}
                        />
                        <button
                          type="submit"
                          class="text-sm text-red-600 hover:text-red-500"
                          onClick="return confirm('Are you sure you want to delete this address?')"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </main>
      </div>
    );
  },
);
