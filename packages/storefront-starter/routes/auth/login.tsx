/**
 * Login Page
 */

import { define } from "@/utils.ts";
// Per-request API client from middleware (ctx.state.api)
import { isSafeRedirect, setSessionCookie } from "@/lib/auth.ts";

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
        email: "",
      },
    };
  },

  async POST(ctx) {
    const formData = await ctx.req.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const rawRedirect = formData.get("redirect") as string || "/";
    const redirect = isSafeRedirect(rawRedirect) ? rawRedirect : "/";

    if (!email || !password) {
      return {
        data: {
          error: "Email and password are required",
          email,
        },
      };
    }

    const response = await ctx.state.api.login(email, password);

    if (!response.success || !response.data) {
      return {
        data: {
          error: response.error || "Invalid email or password",
          email,
        },
      };
    }

    // Set session cookie and redirect
    const headers = new Headers();
    setSessionCookie(headers, response.data.token);
    headers.set("Location", redirect);

    return new Response(null, {
      status: 302,
      headers,
    });
  },
});

export default define.page<typeof handler>(function LoginPage({ data, url }) {
  const { error, email } = data;
  const redirect = url.searchParams.get("redirect") || "/";

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <a
              href={`/auth/register?redirect=${encodeURIComponent(redirect)}`}
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              create a new account
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
                  data-testid="login-error"
                >
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <form class="mt-8 space-y-6" method="POST" data-testid="login-form">
          <input type="hidden" name="redirect" value={redirect} />

          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email" class="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                value={email}
                data-testid="login-email"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label for="password" class="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                data-testid="login-password"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="text-sm">
              <a
                href="/auth/forgot-password"
                class="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              data-testid="login-submit"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>

        {/* OAuth options */}
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
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
        </div>

        <div class="text-center">
          <a href="/" class="text-sm text-gray-600 hover:text-indigo-600">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
});
