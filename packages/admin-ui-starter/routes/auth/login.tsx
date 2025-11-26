import { define } from "@/utils.ts";
import { login, type LoginCredentials } from "@/lib/auth.ts";

interface LoginPageData {
  error?: string;
}

export const handler = define.handlers({
  GET(ctx) {
    // Check if user is already logged in
    const cookies = ctx.req.headers.get("cookie") || "";
    const authToken = cookies.match(/auth_token=([^;]+)/)?.[1];
    if (authToken) {
      return ctx.redirect("/");
    }
    return { data: {} };
  },

  async POST(ctx) {
    const form = await ctx.req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();

    if (!email || !password) {
      return { data: { error: "Email and password are required" } };
    }

    try {
      const credentials: LoginCredentials = { email, password };
      const response = await login(credentials);

      // Backend returns { status: "success", data: { token, user } }
      if (response.status === "success" && response.data.token) {
        // Set cookie in response headers
        const headers = new Headers();
        headers.set(
          "Set-Cookie",
          `auth_token=${response.data.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${
            7 * 24 * 60 * 60
          }`,
        );
        headers.set("Location", "/");

        return new Response(null, {
          status: 303,
          headers,
        });
      }

      return { data: { error: "Login failed" } };
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error
        ? error.message
        : "Login failed. Please try again.";
      return { data: { error: message } };
    }
  },
});

export default define.page<typeof handler>(function LoginPage({ data }) {
  const pageData = data as LoginPageData;
  return (
    <div class="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#fefefe,_#ecf2ff,_#f7ecff)] px-4">
      <div class="card w-full max-w-md bg-white/95 backdrop-blur rounded-3xl border border-white/70 shadow-[0_20px_60px_rgba(79,70,229,0.18)]">
        <div class="card-body px-8 py-10 space-y-6">
          <div class="text-center mb-6">
            <div class="inline-block w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <span class="text-2xl font-bold text-white">TS</span>
            </div>
            <h2 class="card-title text-3xl font-bold justify-center text-gray-800">
              Admin Login
            </h2>
            <p class="text-gray-500 mt-2">TStack Kit Dashboard</p>
          </div>

          {pageData.error && (
            <div class="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{pageData.error}</span>
            </div>
          )}

          <form method="POST" class="space-y-5">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold text-gray-700 text-sm">
                  Email Address
                </span>
              </label>
              <input
                type="email"
                name="email"
                autoComplete="off"
                placeholder="admin@example.com"
                class="input input-bordered w-full h-12 text-base rounded-xl border border-gray-300 bg-white text-gray-900 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-gray-700"
                required
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold text-gray-700 text-sm">
                  Password
                </span>
              </label>
              <input
                type="password"
                name="password"
                autoComplete="off"
                placeholder="Enter your password"
                class="input input-bordered w-full h-12 text-base rounded-xl border border-gray-300 bg-white text-gray-900 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-gray-700"
                required
              />
            </div>

            <div class="form-control mt-8">
              <button
                type="submit"
                class="h-12 w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-300"
              >
                Sign In →
              </button>
            </div>
          </form>

          <div class="divider text-gray-400">Test Credentials</div>
          <div class="rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 p-4 space-y-1">
            <p class="text-sm text-gray-700">
              <span class="font-semibold text-gray-800">Email:</span>{" "}
              <span class="font-mono text-blue-600">dev-admin@example.com</span>
            </p>
            <p class="text-sm text-gray-700">
              <span class="font-semibold text-gray-800">Password:</span>{" "}
              <span class="font-mono text-blue-600">DevPassword123!</span>
            </p>
          </div>

          <div class="text-center text-sm text-gray-500 mt-4">
            <p class="mb-1">Having issues logging in?</p>
            <a
              href="/auth/clear-session"
              class="link link-primary text-xs font-medium hover:underline"
            >
              Clear session and try again
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});
