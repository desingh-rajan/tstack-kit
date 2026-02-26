/**
 * Register Page
 */

import { define } from "@/utils.ts";
import { isSafeRedirect } from "@/lib/auth.ts";
// Per-request API client from middleware (ctx.state.api)

export const handler = define.handlers({
  GET(ctx) {
    // Already logged in?
    if (ctx.state.user) {
      const raw = ctx.url.searchParams.get("redirect") || "/";
      const redirect = isSafeRedirect(raw) ? raw : "/";
      return new Response(null, {
        status: 302,
        headers: { Location: redirect },
      });
    }

    return {
      data: {
        error: null,
        success: null,
        email: "",
        fullName: "",
      },
    };
  },

  async POST(ctx) {
    const formData = await ctx.req.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const fullName = formData.get("fullName") as string;

    // Validation
    if (!email || !password) {
      return {
        data: {
          error: "Email and password are required",
          success: null,
          email,
          fullName,
        },
      };
    }

    if (password !== confirmPassword) {
      return {
        data: {
          error: "Passwords do not match",
          success: null,
          email,
          fullName,
        },
      };
    }

    if (password.length < 8) {
      return {
        data: {
          error: "Password must be at least 8 characters",
          success: null,
          email,
          fullName,
        },
      };
    }

    const response = await ctx.state.api.register({
      email,
      password,
      fullName: fullName || undefined,
    });

    if (!response.success) {
      return {
        data: {
          error: response.error || "Registration failed",
          success: null,
          email,
          fullName,
        },
      };
    }

    return {
      data: {
        error: null,
        success:
          "Account created successfully! Please check your email to verify your account.",
        email: "",
        fullName: "",
      },
    };
  },
});

export default define.page<typeof handler>(function RegisterPage({
  data,
  url,
}) {
  const { error, success, email, fullName } = data;
  const redirect = url.searchParams.get("redirect") || "/";

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href={`/auth/login?redirect=${encodeURIComponent(redirect)}`}
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </a>
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
                <p
                  class="text-sm font-medium text-red-800"
                  data-testid="register-error"
                >
                  {error}
                </p>
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

        {!success && (
          <form
            class="mt-8 space-y-6"
            method="POST"
            data-testid="register-form"
          >
            {/* OAuth options */}
            <div>
              <div class="grid grid-cols-2 gap-3">
                <a
                  href="/api/auth/google"
                  class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                    />
                  </svg>
                  <span class="ml-2">Google</span>
                </a>
                <a
                  href="/api/auth/facebook"
                  class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span class="ml-2">Facebook</span>
                </a>
              </div>

              <div class="relative mt-6">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300" />
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-gray-50 text-gray-500">
                    Or register with email
                  </span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label
                  for="fullName"
                  class="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autocomplete="name"
                  value={fullName}
                  data-testid="register-fullname"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700"
                >
                  Email address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  value={email}
                  data-testid="register-email"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  for="password"
                  class="block text-sm font-medium text-gray-700"
                >
                  Password *
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
                  Confirm Password *
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
                data-testid="register-submit"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create account
              </button>
            </div>
          </form>
        )}

        <div class="text-center">
          <a href="/" class="text-sm text-gray-600 hover:text-indigo-600">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
});
