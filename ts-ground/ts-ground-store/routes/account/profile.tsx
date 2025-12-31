/**
 * Profile Page
 */

import { define } from "@/utils.ts";
import { api } from "@/lib/api.ts";
import { requireAuth } from "@/lib/auth.ts";

export const handler = define.handlers({
  GET(ctx) {
    const token = requireAuth(ctx, "/account/profile");
    if (token instanceof Response) return token;

    return ctx.render({
      user: ctx.state.user,
      error: null,
      success: null,
    });
  },

  async POST(ctx) {
    const token = requireAuth(ctx, "/account/profile");
    if (token instanceof Response) return token;

    api.setToken(token);

    const formData = await ctx.req.formData();
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;

    const response = await api.updateProfile({
      fullName: fullName || undefined,
      phone: phone || undefined,
    });

    if (!response.success) {
      return ctx.render({
        user: ctx.state.user,
        error: response.error || "Failed to update profile",
        success: null,
      });
    }

    return ctx.render({
      user: response.data,
      error: null,
      success: "Profile updated successfully",
    });
  },
});

export default define.page<typeof handler>(function ProfilePage({ data }) {
  const { user, error, success } = data;

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
              <a
                href="/auth/logout"
                class="text-gray-600 hover:text-indigo-600"
              >
                Logout
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-6">
          <a
            href="/account"
            class="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Back to Account
          </a>
        </div>

        <div class="bg-white shadow-sm rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h1 class="text-xl font-semibold text-gray-900">Profile</h1>
            <p class="text-sm text-gray-500">
              Update your personal information
            </p>
          </div>

          <div class="p-6">
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

            <form method="POST" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  class="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label
                  for="fullName"
                  class="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={user?.fullName || ""}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label
                  for="phone"
                  class="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={user?.phone || ""}
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Email Verification Status */}
        <div class="mt-6 bg-white shadow-sm rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Account Status</h2>
          <div class="flex items-center">
            {user?.emailVerified
              ? (
                <>
                  <span class="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
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
                  </span>
                  <span class="ml-3 text-sm text-gray-600">
                    Email verified
                  </span>
                </>
              )
              : (
                <>
                  <span class="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100">
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
                  </span>
                  <div class="ml-3">
                    <span class="text-sm text-gray-600">
                      Email not verified
                    </span>
                    <button
                      type="button"
                      class="ml-2 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Resend verification email
                    </button>
                  </div>
                </>
              )}
          </div>
        </div>
      </main>
    </div>
  );
});
