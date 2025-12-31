/**
 * Email Verification Page
 */

import { define } from "@/utils.ts";
import { api } from "@/lib/api.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const token = ctx.url.searchParams.get("token");

    if (!token) {
      return ctx.render({
        success: false,
        message: "Invalid verification link. No token provided.",
      });
    }

    const response = await api.verifyEmail(token);

    return ctx.render({
      success: response.success,
      message: response.success
        ? "Your email has been verified successfully!"
        : response.error ||
          "Failed to verify email. The link may have expired.",
    });
  },
});

export default define.page<typeof handler>(function VerifyEmailPage({ data }) {
  const { success, message } = data;

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          {success
            ? (
              <>
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <svg
                    class="h-8 w-8 text-green-600"
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
                </div>
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                  Email Verified
                </h2>
              </>
            )
            : (
              <>
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <svg
                    class="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                  Verification Failed
                </h2>
              </>
            )}
          <p class="mt-2 text-sm text-gray-600">{message}</p>
        </div>

        <div class="mt-8 space-y-4">
          <a
            href="/auth/login"
            class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Login
          </a>
          <a
            href="/"
            class="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
});
