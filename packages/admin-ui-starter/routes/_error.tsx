import { define } from "@/utils.ts";

export default define.page(function ErrorPage({ error }) {
  const status = (error as { status?: number })?.status ?? 500;
  const is404 = status === 404;

  const title = is404 ? "Page Not Found" : "Something Went Wrong";
  const message = is404
    ? "The page you are looking for does not exist."
    : "An unexpected error occurred. Please try again later.";

  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p class="text-6xl font-bold text-gray-300">{status}</p>
      <h1 class="mt-4 text-2xl font-semibold text-gray-900">{title}</h1>
      <p class="mt-2 text-gray-600">{message}</p>
      <a
        href="/"
        class="mt-8 inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        Back to Dashboard
      </a>
    </div>
  );
});
