/**
 * Refund Policy Page
 *
 * Static refund/return policy - customize for your business
 */

import { define } from "@/utils.ts";

export default define.page(function RefundPolicy() {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Refund and Return Policy
        </h1>
        <p class="mt-2 text-sm text-gray-500">Last updated: January 2025</p>

        <div class="mt-10 space-y-8 text-gray-600">
          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              1. Return Eligibility
            </h2>
            <p class="mt-4">
              We accept returns within 30 days of delivery for most items. To be
              eligible for a return, your item must be:
            </p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Unused and in the same condition as received</li>
              <li>In the original packaging</li>
              <li>Accompanied by the receipt or proof of purchase</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              2. Non-Returnable Items
            </h2>
            <p class="mt-4">
              The following items cannot be returned:
            </p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Gift cards</li>
              <li>Downloadable products</li>
              <li>Personalized or custom-made items</li>
              <li>Items marked as final sale</li>
              <li>Items damaged through customer misuse</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              3. How to Initiate a Return
            </h2>
            <p class="mt-4">
              To start a return, please follow these steps:
            </p>
            <ol class="mt-4 list-decimal pl-5 space-y-2">
              <li>Contact our customer support at support@example.com</li>
              <li>Provide your order number and reason for return</li>
              <li>Wait for return authorization and shipping instructions</li>
              <li>Ship the item back in its original packaging</li>
            </ol>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              4. Refund Process
            </h2>
            <p class="mt-4">
              Once we receive and inspect your return, we will notify you of the
              approval or rejection of your refund. If approved:
            </p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Refunds are processed within 5-7 business days</li>
              <li>Refunds are credited to the original payment method</li>
              <li>
                Shipping costs are non-refundable unless the return is due to
                our error
              </li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              5. Exchanges
            </h2>
            <p class="mt-4">
              If you need to exchange an item for a different size, color, or
              product, please initiate a return and place a new order. This
              ensures the fastest processing time.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              6. Damaged or Defective Items
            </h2>
            <p class="mt-4">
              If you receive a damaged or defective item, please contact us
              within 48 hours of delivery. We will arrange a replacement or full
              refund at no additional cost to you.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              7. Late or Missing Refunds
            </h2>
            <p class="mt-4">
              If you haven't received your refund after the stated timeframe:
            </p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Check your bank account or credit card statement</li>
              <li>Contact your bank (processing times may vary)</li>
              <li>
                If you still haven't received it, contact us at
                support@example.com
              </li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              8. Contact Us
            </h2>
            <p class="mt-4">
              If you have any questions about our Refund Policy, please contact
              us at support@example.com.
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
