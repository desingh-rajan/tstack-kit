/**
 * Profile Page - Beautiful user profile with avatar and editable info
 */

import { define } from "@/utils.ts";
import { requireAuth } from "@/lib/auth.ts";
import Navbar from "@/components/Navbar.tsx";
import Footer from "@/components/Footer.tsx";

export const handler = define.handlers({
  GET(ctx) {
    const token = requireAuth(ctx, "/account/profile");
    if (token instanceof Response) return token;

    return {
      data: {
        user: ctx.state.user,
        cart: ctx.state.cart,
        error: null,
        success: null,
      },
    };
  },

  async POST(ctx) {
    const token = requireAuth(ctx, "/account/profile");
    if (token instanceof Response) return token;

    const api = ctx.state.api;
    api.setToken(token);

    const formData = await ctx.req.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;

    const response = await api.updateProfile({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
    });

    if (!response.success) {
      return {
        data: {
          user: ctx.state.user,
          cart: ctx.state.cart,
          error: response.error || "Failed to update profile",
          success: null,
        },
      };
    }

    return {
      data: {
        user: response.data,
        cart: ctx.state.cart,
        error: null,
        success: "Profile updated successfully",
      },
    };
  },
});

export default define.page<typeof handler>(function ProfilePage({ data }) {
  const { user, cart, error, success } = data;
  const cartCount = cart?.items?.length || 0;

  // Get display name and initials
  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.username || user?.email?.split("@")[0] || "User";

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] || ""}`.toUpperCase()
    : displayName.substring(0, 2).toUpperCase();

  return (
    <div class="min-h-screen bg-gray-50">
      <Navbar user={user} cartCount={cartCount} />

      {/* Spacer for fixed navbar */}
      <div class="h-16"></div>

      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav class="mb-6">
          <ol class="flex items-center space-x-2 text-sm">
            <li>
              <a href="/" class="text-gray-500 hover:text-indigo-600">Home</a>
            </li>
            <li class="text-gray-400">/</li>
            <li>
              <a href="/account" class="text-gray-500 hover:text-indigo-600">
                Account
              </a>
            </li>
            <li class="text-gray-400">/</li>
            <li class="text-indigo-600 font-medium">Profile</li>
          </ol>
        </nav>

        {/* Profile Header Card */}
        <div class="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div class="bg-gradient-to-r from-indigo-500 to-purple-600 h-32">
          </div>
          <div class="px-6 pb-6">
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12">
              {/* Avatar */}
              <div class="flex items-end">
                {user?.avatarUrl
                  ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      class="w-24 h-24 rounded-xl object-cover ring-4 ring-white shadow-lg"
                    />
                  )
                  : (
                    <div class="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-lg">
                      {initials}
                    </div>
                  )}
                <div class="ml-4 mb-1">
                  <h1 class="text-2xl font-bold text-gray-900">
                    {displayName}
                  </h1>
                  <p class="text-gray-500">{user?.email}</p>
                </div>
              </div>

              {/* Quick stats */}
              <div class="mt-4 sm:mt-0 flex space-x-6">
                <div class="text-center">
                  <p class="text-2xl font-bold text-gray-900">0</p>
                  <p class="text-xs text-gray-500">Orders</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-bold text-gray-900">0</p>
                  <p class="text-xs text-gray-500">Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div class="lg:col-span-2">
            <div class="bg-white shadow-sm rounded-xl">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">
                  Personal Information
                </h2>
                <p class="text-sm text-gray-500">Update your profile details</p>
              </div>

              <div class="p-6">
                {error && (
                  <div class="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
                    <div class="flex">
                      <svg
                        class="w-5 h-5 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p class="ml-3 text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {success && (
                  <div class="rounded-lg bg-green-50 border border-green-200 p-4 mb-6">
                    <div class="flex">
                      <svg
                        class="w-5 h-5 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p class="ml-3 text-sm font-medium text-green-800">
                        {success}
                      </p>
                    </div>
                  </div>
                )}

                <form method="POST" class="space-y-5">
                  {/* Email - readonly */}
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div class="relative">
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        class="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed pr-10"
                      />
                      <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                          class="w-5 h-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    </div>
                    <p class="mt-1 text-xs text-gray-500">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Name fields */}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        for="firstName"
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={user?.firstName || ""}
                        placeholder="John"
                        class="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                    <div>
                      <label
                        for="lastName"
                        class="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={user?.lastName || ""}
                        placeholder="Doe"
                        class="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      for="phone"
                      class="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={user?.phone || ""}
                      placeholder="+91 98765 43210"
                      class="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    />
                  </div>

                  <div class="flex justify-end pt-4">
                    <button
                      type="submit"
                      class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div class="space-y-6">
            {/* Account Status */}
            <div class="bg-white shadow-sm rounded-xl p-6">
              <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Account Status
              </h3>

              <div class="space-y-4">
                {/* Email verification */}
                <div class="flex items-center">
                  {user?.isEmailVerified
                    ? (
                      <>
                        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg
                            class="w-5 h-5 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div class="ml-3">
                          <p class="text-sm font-medium text-gray-900">
                            Email Verified
                          </p>
                          <p class="text-xs text-gray-500">
                            Your email is confirmed
                          </p>
                        </div>
                      </>
                    )
                    : (
                      <>
                        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <svg
                            class="w-5 h-5 text-yellow-600"
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
                        </div>
                        <div class="ml-3">
                          <p class="text-sm font-medium text-gray-900">
                            Email Not Verified
                          </p>
                          <button
                            type="button"
                            class="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                          >
                            Resend verification
                          </button>
                        </div>
                      </>
                    )}
                </div>

                {/* Account active */}
                <div class="flex items-center">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      class="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm font-medium text-gray-900">
                      Account Active
                    </p>
                    <p class="text-xs text-gray-500">
                      Your account is in good standing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div class="bg-white shadow-sm rounded-xl p-6">
              <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                Quick Links
              </h3>
              <nav class="space-y-2">
                <a
                  href="/account/orders"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg
                    class="w-5 h-5 mr-3 text-gray-400"
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
                  My Orders
                </a>
                <a
                  href="/account/addresses"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg
                    class="w-5 h-5 mr-3 text-gray-400"
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
                  Addresses
                </a>
                <a
                  href="/account"
                  class="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg
                    class="w-5 h-5 mr-3 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Account Settings
                </a>
              </nav>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
});
