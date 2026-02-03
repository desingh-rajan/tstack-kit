/**
 * Privacy Policy Page
 *
 * Static privacy policy - customize for your business
 */

import { define } from "@/utils.ts";

export default define.page(function PrivacyPolicy() {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p class="mt-2 text-sm text-gray-500">Last updated: January 2025</p>

        <div class="mt-10 space-y-8 text-gray-600">
          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              1. Information We Collect
            </h2>
            <p class="mt-4">
              We collect information you provide directly to us, such as when
              you create an account, make a purchase, or contact us for support.
              This information may include:
            </p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Name and email address</li>
              <li>Billing and shipping address</li>
              <li>
                Payment information (processed securely by our payment provider)
              </li>
              <li>Phone number</li>
              <li>Order history and preferences</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              2. How We Use Your Information
            </h2>
            <p class="mt-4">We use the information we collect to:</p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Send you order confirmations and updates</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Improve our website and services</li>
              <li>Send promotional communications (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              3. Information Sharing
            </h2>
            <p class="mt-4">
              We do not sell, trade, or otherwise transfer your personal
              information to outside parties except as described in this policy.
              We may share information with:
            </p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Service providers who assist in our operations</li>
              <li>Payment processors to complete transactions</li>
              <li>Shipping carriers to deliver your orders</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              4. Data Security
            </h2>
            <p class="mt-4">
              We implement appropriate security measures to protect your
              personal information. However, no method of transmission over the
              Internet is 100% secure, and we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              5. Your Rights
            </h2>
            <p class="mt-4">
              You have the right to access, correct, or delete your personal
              information. You may also opt out of promotional communications at
              any time by clicking the unsubscribe link in our emails.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              6. Cookies
            </h2>
            <p class="mt-4">
              We use cookies and similar technologies to enhance your experience
              on our website. You can control cookies through your browser
              settings.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              7. Contact Us
            </h2>
            <p class="mt-4">
              If you have any questions about this Privacy Policy, please
              contact us at support@example.com.
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
