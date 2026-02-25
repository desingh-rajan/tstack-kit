import { define } from "../utils.ts";
import Navbar from "../components/Navbar.tsx";

export default define.page(function ErrorPage({ error }) {
  const status = (error as { status?: number })?.status ?? 500;
  const is404 = status === 404;

  const title = is404 ? "Page Not Found" : "Something Went Wrong";
  const message = is404
    ? "The page you are looking for does not exist or has been moved."
    : "An unexpected error occurred. Please try again later.";

  return (
    <>
      <Navbar />
      <div class="h-16"></div>
      <div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <p class="text-6xl font-bold text-gray-300">{status}</p>
        <h1 class="mt-4 text-2xl font-semibold text-gray-900">{title}</h1>
        <p class="mt-2 text-gray-600">{message}</p>
        <a
          href="/"
          class="mt-8 inline-block rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Back to Home
        </a>
      </div>
    </>
  );
});
