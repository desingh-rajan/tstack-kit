/**
 * Reset Password Page
 */

import { define } from "@/utils.ts";
import { api } from "@/lib/api.ts";

export const handler = define.handlers({
  GET(ctx) {
    const token = ctx.url.searchParams.get("token");

    if (!token) {
      return {
        data: {
          error: "Invalid reset link. No token provided.",
          success: null,
          tokenValid: false,
        },
      };
    }

    return {
      data: {
        error: null,
        success: null,
        tokenValid: true,
      },
    };
  },

  async POST(ctx) {
    const formData = await ctx.req.formData();
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token) {
      return {
        data: {
          error: "Invalid reset link",
          success: null,
          tokenValid: false,
        },
      };
    }

    if (!password || !confirmPassword) {
      return {
        data: {
          error: "Password is required",
          success: null,
          tokenValid: true,
        },
      };
    }

    if (password !== confirmPassword) {
      return {
        data: {
          error: "Passwords do not match",
          success: null,
          tokenValid: true,
        },
      };
    }

    if (password.length < 8) {
      return {
        data: {
          error: "Password must be at least 8 characters",
          success: null,
          tokenValid: true,
        },
      };
    }

    const response = await api.resetPassword(token, password);

    if (!response.success) {
      return {
        data: {
          error: response.error ||
            "Failed to reset password. The link may have expired.",
          success: null,
          tokenValid: true,
        },
      };
    }

    return {
      data: {
        error: null,
        success: "Your password has been reset successfully!",
        tokenValid: true,
      },
    };
  },
});

export default define.page<typeof handler>(function ResetPasswordPage({
  data,
  url,
}) {
  const { error, success, tokenValid } = data;
  const token = url.searchParams.get("token");

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set new password
          </h2>
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
                <p class="mt-2 text-sm text-green-700">
                  <a
                    href="/auth/login"
                    class="font-medium underline hover:text-green-600"
                  >
                    Go to login
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {tokenValid && !success && (
          <form class="mt-8 space-y-6" method="POST">
            <input type="hidden" name="token" value={token || ""} />

            <div class="space-y-4">
              <div>
                <label
                  for="password"
                  class="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="new-password"
                  required
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label
                  for="confirmPassword"
                  class="block text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reset password
              </button>
            </div>
          </form>
        )}

        {!tokenValid && (
          <div class="text-center">
            <a
              href="/auth/forgot-password"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Request a new reset link
            </a>
          </div>
        )}
      </div>
    </div>
  );
});
