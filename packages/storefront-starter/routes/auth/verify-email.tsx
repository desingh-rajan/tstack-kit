/**
 * Email Verification Page
 * Beautiful dark-theme verification result with store branding
 */

import { define } from "@/utils.ts";
// Per-request API client from middleware (ctx.state.api)

export const handler = define.handlers({
  async GET(ctx) {
    const token = ctx.url.searchParams.get("token");

    if (!token) {
      return {
        data: {
          success: false,
          message: "Invalid verification link. No token provided.",
        },
      };
    }

    const response = await ctx.state.api.verifyEmail(token);

    return {
      data: {
        success: response.success,
        message: response.success
          ? "Your email has been verified successfully! You can now sign in to your account."
          : response.error ||
            "Failed to verify email. The link may have expired.",
      },
    };
  },
});

export default define.page<typeof handler>(function VerifyEmailPage({ data }) {
  const { success, message } = data;

  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse">
        </div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse">
        </div>
      </div>

      <div class="relative max-w-md w-full">
        {/* Card */}
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 sm:p-10">
          {/* Logo/Brand */}
          <div class="text-center mb-8">
            <a href="/" class="inline-flex items-center space-x-2">
              <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <span class="text-xl font-bold text-white">TStack Store</span>
            </a>
          </div>

          {/* Status Icon */}
          <div class="flex justify-center mb-6">
            {success
              ? (
                <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25">
                  <svg
                    class="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )
              : (
                <div class="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/25">
                  <svg
                    class="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2.5"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              )}
          </div>

          {/* Title */}
          <h1
            class={`text-2xl sm:text-3xl font-bold text-center mb-3 ${
              success ? "text-green-400" : "text-red-400"
            }`}
          >
            {success ? "Email Verified!" : "Verification Failed"}
          </h1>

          {/* Message */}
          <p class="text-slate-300 text-center mb-8 leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div class="space-y-4">
            {success
              ? (
                <>
                  <a
                    href="/auth/login"
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign In Now
                  </a>
                  <a
                    href="/"
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg border border-slate-600 transition-all duration-200"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Continue Shopping
                  </a>
                </>
              )
              : (
                <>
                  <a
                    href="/auth/register"
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Try Again
                  </a>
                  <a
                    href="/"
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg border border-slate-600 transition-all duration-200"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Back to Home
                  </a>
                </>
              )}
          </div>

          {/* Help text */}
          <p class="mt-8 text-center text-sm text-slate-400">
            {success
              ? <>Welcome to TStack Store! Start exploring our products.</>
              : (
                <>
                  Need help?{" "}
                  <a
                    href="/contact"
                    class="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Contact Support
                  </a>
                </>
              )}
          </p>
        </div>

        {/* Footer links */}
        <div class="mt-6 flex justify-center space-x-6 text-sm text-slate-400">
          <a href="/privacy" class="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="/terms" class="hover:text-white transition-colors">Terms</a>
          <a href="/contact" class="hover:text-white transition-colors">
            Contact
          </a>
        </div>
      </div>
    </div>
  );
});
