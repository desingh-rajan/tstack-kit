export default function About() {
  return (
    <div class="bg-white py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              About Our Store
            </h2>
            <p class="mt-3 max-w-3xl text-lg text-gray-500">
              We believe in quality craftsmanship and transparent business
              practices. Every product in our catalog is hand-picked to ensure
              it meets our rigorous standards for sustainability and durability.
            </p>
            <div class="mt-8 sm:flex">
              <div class="rounded-md shadow">
                <a
                  href="/about"
                  class="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-3 text-base font-medium text-white hover:bg-indigo-700"
                >
                  Read our story
                </a>
              </div>
            </div>
          </div>
          <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:mt-0 lg:grid-cols-2">
            <div class="col-span-1 flex flex-col items-center justify-center bg-gray-50 py-8 px-4 rounded-lg">
              <svg
                class="h-12 w-12 text-gray-400"
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
              <span class="mt-2 text-sm font-medium text-gray-600">
                Secure Checkout
              </span>
            </div>
            <div class="col-span-1 flex flex-col items-center justify-center bg-gray-50 py-8 px-4 rounded-lg">
              <svg
                class="h-12 w-12 text-gray-400"
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
              <span class="mt-2 text-sm font-medium text-gray-600">
                Fast Shipping
              </span>
            </div>
            <div class="col-span-1 flex flex-col items-center justify-center bg-gray-50 py-8 px-4 rounded-lg">
              <svg
                class="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              <span class="mt-2 text-sm font-medium text-gray-600">
                Top Rated
              </span>
            </div>
            <div class="col-span-1 flex flex-col items-center justify-center bg-gray-50 py-8 px-4 rounded-lg">
              <svg
                class="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span class="mt-2 text-sm font-medium text-gray-600">
                Easy Returns
              </span>
            </div>
            <div class="col-span-1 flex flex-col items-center justify-center bg-gray-50 py-8 px-4 rounded-lg">
              <svg
                class="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="mt-2 text-sm font-medium text-gray-600">
                Best Value
              </span>
            </div>
            <div class="col-span-1 flex flex-col items-center justify-center bg-gray-50 py-8 px-4 rounded-lg">
              <svg
                class="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span class="mt-2 text-sm font-medium text-gray-600">
                Trusted Payments
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
