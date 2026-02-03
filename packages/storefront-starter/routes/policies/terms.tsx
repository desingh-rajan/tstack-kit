/**
 * Terms of Service Page
 *
 * Static terms page - customize for your business
 */

import { define } from "@/utils.ts";

export default define.page(function TermsOfService() {
  return (
    <div class="min-h-screen bg-gray-50">
      <div class="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p class="mt-2 text-sm text-gray-500">Last updated: January 2025</p>

        <div class="mt-10 space-y-8 text-gray-600">
          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              1. Acceptance of Terms
            </h2>
            <p class="mt-4">
              By accessing or using our website, you agree to be bound by these
              Terms of Service. If you do not agree to all the terms and
              conditions, you may not access or use our services.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              2. Account Registration
            </h2>
            <p class="mt-4">
              To make purchases, you may need to create an account. You are
              responsible for:
            </p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Providing accurate and complete information</li>
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              3. Products and Pricing
            </h2>
            <p class="mt-4">
              We strive to provide accurate product descriptions and pricing.
              However, errors may occur. We reserve the right to:
            </p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Correct any errors in product information</li>
              <li>Update prices without prior notice</li>
              <li>Limit quantities available for purchase</li>
              <li>Cancel orders in case of pricing errors</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              4. Orders and Payment
            </h2>
            <p class="mt-4">
              When you place an order, you agree to provide accurate payment
              information. All payments are processed securely through our
              payment partners. We reserve the right to refuse or cancel any
              order for any reason.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              5. Intellectual Property
            </h2>
            <p class="mt-4">
              All content on this website, including text, graphics, logos,
              images, and software, is our property or the property of our
              licensors and is protected by intellectual property laws.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              6. Prohibited Activities
            </h2>
            <p class="mt-4">You agree not to:</p>
            <ul class="mt-4 list-disc pl-5 space-y-2">
              <li>Use the website for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the website's operation</li>
              <li>Transmit any viruses or malicious code</li>
              <li>Scrape or collect data without permission</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              7. Limitation of Liability
            </h2>
            <p class="mt-4">
              To the fullest extent permitted by law, we shall not be liable for
              any indirect, incidental, special, consequential, or punitive
              damages arising from your use of our services.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              8. Changes to Terms
            </h2>
            <p class="mt-4">
              We may modify these terms at any time. Continued use of the
              website after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              9. Contact Us
            </h2>
            <p class="mt-4">
              If you have any questions about these Terms of Service, please
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
