export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" class="sr-only">Footer</h2>
      <div class="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div class="xl:grid xl:grid-cols-3 xl:gap-8">
          <div class="space-y-8">
            <div class="flex items-center space-x-2">
              <div class="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-xl">T</span>
              </div>
              <span class="text-white font-bold text-xl">TStack Store</span>
            </div>
            <p class="text-sm leading-6 text-gray-300">
              Making modern e-commerce accessible, performant, and delightful
              for everyone.
            </p>
            <div class="flex space-x-6">
              {/* Social links placeholder */}
              <a href="#" class="text-gray-400 hover:text-gray-300">
                <span class="sr-only">Facebook</span>
                <svg
                  class="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-gray-300">
                <span class="sr-only">GitHub</span>
                <svg
                  class="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0122 12.017C22 6.484 17.522 2 12 2z"
                    clip-rule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div class="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div class="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 class="text-sm font-semibold leading-6 text-white">
                  Solutions
                </h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Marketing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Analytics
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Commerce
                    </a>
                  </li>
                </ul>
              </div>
              <div class="mt-10 md:mt-0">
                <h3 class="text-sm font-semibold leading-6 text-white">
                  Support
                </h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Guides
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div class="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 class="text-sm font-semibold leading-6 text-white">
                  Company
                </h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Jobs
                    </a>
                  </li>
                </ul>
              </div>
              <div class="mt-10 md:mt-0">
                <h3 class="text-sm font-semibold leading-6 text-white">
                  Legal
                </h3>
                <ul role="list" class="mt-6 space-y-4">
                  <li>
                    <a
                      href="/policies/privacy"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/policies/terms"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a
                      href="/policies/refund"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Refund Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/policies/shipping"
                      class="text-sm leading-6 text-gray-300 hover:text-white"
                    >
                      Shipping Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-16 border-t border-gray-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p class="text-xs leading-5 text-gray-400">
            &copy; {currentYear} TStack Kit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
