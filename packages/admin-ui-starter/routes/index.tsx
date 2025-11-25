import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import ThemeSwitcher from "@/islands/ThemeSwitcher.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    // Check if user is already logged in
    const cookies = ctx.req.headers.get("cookie") || "";
    const authToken = cookies.match(/auth_token=([^;]+)/)?.[1];

    if (!authToken) {
      return { data: { isLoggedIn: false } };
    }

    // Validate token by checking if it works
    try {
      const { createApiClient } = await import("@/lib/api.ts");
      const apiClient = createApiClient(authToken);
      // Try a simple API call to validate token
      await apiClient.get("/auth/me");
      return { data: { isLoggedIn: true } };
    } catch {
      // Token is invalid or expired - clear it!
      const headers = new Headers();
      headers.set(
        "Set-Cookie",
        "auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
      );

      return new Response(null, {
        status: 303,
        headers: {
          ...Object.fromEntries(headers),
          Location: ctx.req.url, // Reload same page (now without token)
        },
      });
    }
  },
});

export default define.page<typeof handler>(function Home({ data }) {
  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-base-100 to-purple-50">
      <Head>
        <title>TStack Kit - Build APIs Fast</title>
      </Head>

      {/* Theme Switcher - Fixed Position */}
      <div class="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      {/* Hero Section */}
      <div class="container mx-auto px-4 py-8 md:py-16 max-w-7xl">
        <div class="text-center space-y-6 md:space-y-8">
          {/* Logo */}
          <div class="flex justify-center">
            <div class="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <span class="text-3xl md:text-4xl font-bold text-white">TS</span>
            </div>
          </div>

          {/* Heading */}
          <div class="space-y-3 md:space-y-4">
            <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              TStack Kit
            </h1>
            <p class="text-xl sm:text-2xl md:text-3xl font-light">
              Rails-like backend toolkit for Deno
            </p>
            <p class="text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto px-4">
              Stop rewriting boilerplate. Start building features that matter.
            </p>
          </div>

          {/* Value Props */}
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 px-4">
            <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div class="card-body text-center p-6">
                <div class="text-4xl mb-3 font-bold text-primary">&#9889;</div>
                <h3 class="card-title text-lg md:text-xl justify-center">
                  Save 2-4 Hours
                </h3>
                <p class="text-sm md:text-base text-base-content/70">
                  Skip the setup, start coding features. One command creates
                  your entire project structure.
                </p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div class="card-body text-center p-6">
                <div class="text-4xl mb-3 font-bold text-success">$</div>
                <h3 class="card-title text-lg md:text-xl justify-center">
                  Save $5-15 Per Project
                </h3>
                <p class="text-sm md:text-base text-base-content/70">
                  Stop burning AI tokens on repetitive boilerplate. Each
                  scaffold saves 15-30 prompts.
                </p>
              </div>
            </div>

            <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div class="card-body text-center p-6">
                <div class="text-4xl mb-3 font-bold text-accent">&#10003;</div>
                <h3 class="card-title text-lg md:text-xl justify-center">
                  Focus on Problems
                </h3>
                <p class="text-sm md:text-base text-base-content/70">
                  Stop being a CRUD monkey. Build features that matter with
                  production-ready patterns.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div class="mt-12 md:mt-16">
            <h2 class="text-xl md:text-2xl font-bold mb-4 md:mb-6">
              Built on Modern Tech
            </h2>
            <div class="flex flex-wrap justify-center gap-3 md:gap-4 px-4">
              <span class="badge badge-lg badge-primary">Deno 2.0+</span>
              <span class="badge badge-lg badge-secondary">Hono</span>
              <span class="badge badge-lg badge-accent">Drizzle ORM</span>
              <span class="badge badge-lg badge-info">PostgreSQL</span>
              <span class="badge badge-lg badge-success">TypeScript</span>
            </div>
          </div>

          {/* Quick Example */}
          <div class="mt-12 md:mt-16 bg-base-300 rounded-xl p-6 md:p-8 text-left shadow-2xl mx-4 max-w-4xl lg:mx-auto">
            <div class="text-sm text-base-content/60 mb-4 font-mono">
              Terminal
            </div>
            <div class="space-y-2 font-mono text-xs sm:text-sm overflow-x-auto">
              <div class="text-success"># Create new project</div>
              <div>$ tstack create blog-api</div>
              <div class="text-base-content/60">
                ✓ Project created in 3 seconds
              </div>

              <div class="text-success mt-4">
                # Scaffold complete CRUD entity
              </div>
              <div>$ tstack scaffold articles</div>
              <div class="text-base-content/60">
                ✓ Generated 7 files: model, DTO, service, controller, routes,
                tests
              </div>

              <div class="text-success mt-4"># Start coding features</div>
              <div>$ deno task dev</div>
              <div class="text-base-content/60">
                ✓ Server running at http://localhost:8000
              </div>
            </div>
          </div>

          {/* CTA */}
          <div class="mt-12 md:mt-16 space-y-4 px-4">
            {data.isLoggedIn
              ? (
                <a
                  href="/admin/articles"
                  class="inline-flex items-center justify-center h-12 md:h-14 w-full md:w-auto rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-300 px-6 md:px-8 text-base md:text-lg"
                >
                  View Admin Dashboard →
                </a>
              )
              : (
                <a
                  href="/auth/login"
                  class="inline-flex items-center justify-center h-12 md:h-14 w-full md:w-auto rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-300 px-6 md:px-8 text-base md:text-lg"
                >
                  Sign In to Dashboard
                </a>
              )}
            <div class="text-sm md:text-base text-base-content/70">
              or{" "}
              <a
                href="https://github.com/desingh-rajan/tstack-kit"
                target="_blank"
                class="link link-primary font-semibold"
              >
                explore on GitHub →
              </a>
            </div>
          </div>

          {/* Footer */}
          <div class="mt-16 md:mt-20 pt-8 border-t border-base-300 px-4">
            <p class="text-sm md:text-base text-base-content/70">
              Built by{" "}
              <a
                href="https://desinghrajan.in/"
                target="_blank"
                class="link link-primary"
              >
                Desingh Rajan
              </a>{" "}
              and contributors
            </p>
            <p class="text-xs md:text-sm text-base-content/50 mt-2">
              MIT License • Free for personal and commercial use
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
