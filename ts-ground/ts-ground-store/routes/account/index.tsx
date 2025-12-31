/**
 * Account Dashboard
 */

import { define } from "@/utils.ts";
import { requireAuth } from "@/lib/auth.ts";

export const handler = define.handlers({
  GET(ctx) {
    const token = requireAuth(ctx, "/account");
    if (token instanceof Response) return token;

    return ctx.render({
      user: ctx.state.user,
    });
  },
});

export default define.page<typeof handler>(function AccountPage({ data }) {
  const { user } = data;

  const menuItems = [
    {
      href: "/account/profile",
      label: "Profile",
      description: "Update your personal information",
      icon: (
        <svg
          class="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      href: "/account/orders",
      label: "Orders",
      description: "View your order history",
      icon: (
        <svg
          class="w-6 h-6"
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
      ),
    },
    {
      href: "/account/addresses",
      label: "Addresses",
      description: "Manage your shipping addresses",
      icon: (
        <svg
          class="w-6 h-6"
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
      ),
    },
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
              <a href="/products" class="text-gray-600 hover:text-indigo-600">
                Products
              </a>
              <a href="/cart" class="text-gray-600 hover:text-indigo-600">
                Cart
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

      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">My Account</h1>
          <p class="mt-2 text-gray-600">
            Welcome back, {user?.fullName || user?.email}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              class="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div class="flex items-center">
                <div class="flex-shrink-0 text-indigo-600">{item.icon}</div>
                <div class="ml-4">
                  <h2 class="text-lg font-medium text-gray-900">
                    {item.label}
                  </h2>
                  <p class="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
});
