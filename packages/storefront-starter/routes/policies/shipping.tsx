/**
 * Shipping Policy Page
 *
 * Static shipping policy - customize for your business
 */

import { define } from "@/utils.ts";

export default define.page(function ShippingPolicy() {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Shipping Policy
        </h1>
        <p class="mt-2 text-sm text-gray-500">Last updated: January 2025</p>

        <div class="mt-10 space-y-8 text-gray-600">
          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              1. Processing Time
            </h2>
            <p class="mt-4">
              Orders are typically processed within 1-2 business days. During
              peak seasons or promotional periods, processing may take up to 3-5
              business days.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              2. Shipping Options
            </h2>
            <p class="mt-4">
              We offer the following shipping methods:
            </p>
            <div class="mt-4 overflow-hidden rounded-lg border border-gray-200">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Method
                    </th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Delivery Time
                    </th>
                    <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr>
                    <td class="px-4 py-3 text-sm text-gray-700">Standard</td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      5-7 business days
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      Free on orders over $50
                    </td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3 text-sm text-gray-700">Express</td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      2-3 business days
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      Calculated at checkout
                    </td>
                  </tr>
                  <tr>
                    <td class="px-4 py-3 text-sm text-gray-700">Overnight</td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      1 business day
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-700">
                      Calculated at checkout
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              3. Shipping Destinations
            </h2>
            <p class="mt-4">
              We currently ship to addresses within the United States and select
              international destinations. International shipping times and costs
              vary by location.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              4. Order Tracking
            </h2>
            <p class="mt-4">
              Once your order ships, you will receive an email with tracking
              information. You can also track your order by logging into your
              account and viewing your order history.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              5. Shipping Address
            </h2>
            <p class="mt-4">
              Please ensure your shipping address is correct before placing your
              order. We are not responsible for orders shipped to incorrect
              addresses provided by the customer.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              6. Delivery Issues
            </h2>
            <p class="mt-4">
              If your package is lost, damaged, or significantly delayed, please
              contact us at support@example.com. We will work with the carrier
              to resolve the issue.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              7. International Orders
            </h2>
            <p class="mt-4">
              International customers are responsible for any customs duties,
              taxes, or fees charged by their country. These charges are not
              included in our shipping costs.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              8. Contact Us
            </h2>
            <p class="mt-4">
              If you have any questions about shipping, please contact us at
              support@example.com.
            </p>
          </section>
        </div>

        <div class="mt-10">
          <a
            href="/"
            class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
});
