/**
 * Edit Address Page
 */

import { define } from "@/utils.ts";
import { api } from "@/lib/api.ts";
import { requireAuth } from "@/lib/auth.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const token = requireAuth(ctx, `/account/addresses/${ctx.params.id}/edit`);
    if (token instanceof Response) return token;

    api.setToken(token);
    const addressesResponse = await api.getAddresses();

    if (!addressesResponse.success || !addressesResponse.data) {
      return ctx.redirect("/account/addresses");
    }

    const address = addressesResponse.data.find((a) => a.id === ctx.params.id);
    if (!address) {
      return ctx.redirect("/account/addresses");
    }

    return ctx.render({
      error: null,
      address,
    });
  },

  async POST(ctx) {
    const token = requireAuth(ctx, `/account/addresses/${ctx.params.id}/edit`);
    if (token instanceof Response) return token;

    api.setToken(token);
    const formData = await ctx.req.formData();

    const values = {
      fullName: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      addressLine1: formData.get("addressLine1") as string,
      addressLine2: formData.get("addressLine2") as string || undefined,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      postalCode: formData.get("postalCode") as string,
      country: formData.get("country") as string || "India",
      isDefault: formData.get("isDefault") === "on",
    };

    // Validation
    const required = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
    ];
    const missing = required.filter((f) => !values[f as keyof typeof values]);

    if (missing.length > 0) {
      const addressesResponse = await api.getAddresses();
      const address = addressesResponse.data?.find((a) =>
        a.id === ctx.params.id
      );

      return ctx.render({
        error: `Please fill in all required fields: ${missing.join(", ")}`,
        address: { ...address, ...values, id: ctx.params.id },
      });
    }

    const response = await api.updateAddress(ctx.params.id, values);

    if (!response.success) {
      const addressesResponse = await api.getAddresses();
      const address = addressesResponse.data?.find((a) =>
        a.id === ctx.params.id
      );

      return ctx.render({
        error: response.error || "Failed to update address",
        address: { ...address, ...values, id: ctx.params.id },
      });
    }

    return ctx.redirect("/account/addresses");
  },
});

export default define.page<typeof handler>(function EditAddressPage({ data }) {
  const { error, address } = data;

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
  ];

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
            </nav>
          </div>
        </div>
      </header>

      <main class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-6">
          <a
            href="/account/addresses"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to Addresses
          </a>
        </div>

        <div class="bg-white shadow-sm rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h1 class="text-xl font-semibold text-gray-900">Edit Address</h1>
          </div>

          <div class="p-6">
            {error && (
              <div class="rounded-md bg-red-50 p-4 mb-6">
                <p class="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <form method="POST" class="space-y-6">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div class="sm:col-span-2">
                  <label
                    for="fullName"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    value={address.fullName}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label
                    for="phone"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={address.phone}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label
                    for="addressLine1"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    id="addressLine1"
                    name="addressLine1"
                    required
                    value={address.addressLine1}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label
                    for="addressLine2"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="addressLine2"
                    name="addressLine2"
                    value={address.addressLine2 || ""}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    for="city"
                    class="block text-sm font-medium text-gray-700"
                  >
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={address.city}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    for="state"
                    class="block text-sm font-medium text-gray-700"
                  >
                    State *
                  </label>
                  <select
                    id="state"
                    name="state"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select State</option>
                    {indianStates.map((state) => (
                      <option
                        key={state}
                        value={state}
                        selected={address.state === state}
                      >
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    for="postalCode"
                    class="block text-sm font-medium text-gray-700"
                  >
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    required
                    value={address.postalCode}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label
                    for="country"
                    class="block text-sm font-medium text-gray-700"
                  >
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={address.country}
                    disabled
                    class="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
                  />
                </div>

                <div class="sm:col-span-2">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      name="isDefault"
                      checked={address.isDefault}
                      class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-700">
                      Set as default address
                    </span>
                  </label>
                </div>
              </div>

              <div class="flex justify-end gap-4">
                <a
                  href="/account/addresses"
                  class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </a>
                <button
                  type="submit"
                  class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
});
