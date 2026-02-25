/**
 * Forgot Password Page
 */

import { define } from "@/utils.ts";
// Per-request API client from middleware (ctx.state.api)

export const handler = define.handlers({
  GET(_ctx) {
    return {
      data: {
        error: null,
        success: null,
        email: "",
      },
    };
  },

  async POST(ctx) {
    const formData = await ctx.req.formData();
    const email = formData.get("email") as string;

    if (!email) {
      return {
        data: {
          error: "Email is required",
          success: null,
          email: "",
        },
      };
    }

    const _response = await ctx.state.api.forgotPassword(email);

    // Always show success to prevent email enumeration
    return {
      data: {
        error: null,
        success:
          "If an account exists with this email, you will receive a password reset link.",
        email: "",
      },
    };
  },
});

export default define.page<typeof handler>(function ForgotPasswordPage({
  data,
}) {
  const { error, success, email } = data;

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        {error && (
          <div class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div class="rounded-md bg-green-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {!success && (
          <form class="mt-8 space-y-6" method="POST">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                value={email}
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Send reset link
              </button>
            </div>
          </form>
        )}

        <div class="text-center space-y-2">
          <a
            href="/auth/login"
            class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
});
