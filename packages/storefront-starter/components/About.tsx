import type { JSX } from "preact";

export default function About() {
  return (
    <div class="bg-white py-16 sm:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              About Our Store
            </h2>
            <p class="mt-3 max-w-3xl text-lg text-gray-500">
              We believe in quality craftsmanship and transparent business
              practices. Every product in our catalog is hand-picked to ensure
              it meets our rigorous standards for sustainability and durability.
            </p>
            <div class="mt-8 sm:flex">
              <div class="rounded-md shadow">
                <a
                  href="#"
                  class="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-5 py-3 text-base font-medium text-white hover:bg-indigo-700"
                >
                  Read our story
                </a>
              </div>
            </div>
          </div>
          <div class="mt-8 grid grid-cols-2 gap-0.5 md:grid-cols-3 lg:mt-0 lg:grid-cols-2">
            <div class="col-span-1 flex justify-center bg-gray-50 py-8 px-8">
              <img
                class="max-h-12"
                src="https://tailwindui.com/img/logos/transistor-logo-gray-400.svg"
                alt="Transistor"
              />
            </div>
            <div class="col-span-1 flex justify-center bg-gray-50 py-8 px-8">
              <img
                class="max-h-12"
                src="https://tailwindui.com/img/logos/mirage-logo-gray-400.svg"
                alt="Mirage"
              />
            </div>
            <div class="col-span-1 flex justify-center bg-gray-50 py-8 px-8">
              <img
                class="max-h-12"
                src="https://tailwindui.com/img/logos/tuple-logo-gray-400.svg"
                alt="Tuple"
              />
            </div>
            <div class="col-span-1 flex justify-center bg-gray-50 py-8 px-8">
              <img
                class="max-h-12"
                src="https://tailwindui.com/img/logos/laravel-logo-gray-400.svg"
                alt="Laravel"
              />
            </div>
            <div class="col-span-1 flex justify-center bg-gray-50 py-8 px-8">
              <img
                class="max-h-12"
                src="https://tailwindui.com/img/logos/statamic-logo-gray-400.svg"
                alt="Statamic"
              />
            </div>
            <div class="col-span-1 flex justify-center bg-gray-50 py-8 px-8">
              <img
                class="max-h-12"
                src="https://tailwindui.com/img/logos/workcation-logo-gray-400.svg"
                alt="Workcation"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
