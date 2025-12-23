import { JSX } from "preact";

export default function Navbar() {
  return (
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          {/* Logo */}
          <div class="flex-shrink-0">
            <a href="/" class="flex items-center">
              <svg
                class="h-8 w-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span class="ml-2 text-xl font-bold text-gray-900">Store</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <a
                href="/"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
              >
                Home
              </a>
              <a
                href="/"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
              >
                Products
              </a>
              <a
                href="/"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
              >
                About
              </a>
              <a
                href="/"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Right side actions */}
          <div class="hidden md:flex items-center space-x-4">
            <a
              href="/"
              class="text-gray-700 hover:text-indigo-600 transition-colors"
              aria-label="Search"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </a>
            <a
              href="/"
              class="text-gray-700 hover:text-indigo-600 transition-colors relative"
              aria-label="Shopping cart"
            >
              <svg
                class="h-6 w-6"
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
              <span class="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </a>
            <a
              href="/"
              class="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Sign in
            </a>
          </div>

          {/* Mobile menu button */}
          <div class="md:hidden">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
              aria-label="Open menu"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - hidden by default, toggle with island for interactivity */}
      <div class="hidden md:hidden border-t border-gray-200">
        <div class="space-y-1 px-2 pb-3 pt-2">
          <a
            href="/"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-indigo-600"
          >
            Home
          </a>
          <a
            href="/"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
          >
            Products
          </a>
          <a
            href="/"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
          >
            About
          </a>
          <a
            href="/"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600"
          >
            Contact
          </a>
          <a
            href="/"
            class="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-gray-100"
          >
            Sign in
          </a>
        </div>
      </div>
    </nav>
  );
}
