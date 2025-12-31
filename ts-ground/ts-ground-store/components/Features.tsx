import type { JSX } from "preact";

interface Feature {
  name: string;
  description: string;
  icon: (props: { class?: string }) => JSX.Element;
}

function BoltIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class={props.class}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  );
}

function ScaleIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class={props.class}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A5.96 5.96 0 009.99 4.97m9.75 0V3m0 2.97l-.613 1.326c-.163.351-.309.722-.434 1.107M9.99 4.97V3m0 2.97l.613 1.326c.163.351.309.722.434 1.107M3.75 19.5a2.25 2.25 0 002.25 2.25m0 0a21.948 21.948 0 0112 0 2.25 2.25 0 002.25-2.25m-18 0l1.183-3.943c.182-.609.432-1.2.748-1.76.621-1.096 1.4-2.083 2.308-2.923a11.25 11.25 0 015.512-3.085m6 0a11.25 11.25 0 00-6 0m6 0a11.25 11.25 0 015.512 3.085c.907.84 1.687 1.827 2.308 2.923.316.56.566 1.151.748 1.76l1.183 3.943"
      />
    </svg>
  );
}

function GlobeIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class={props.class}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    </svg>
  );
}

const features: Feature[] = [
  {
    name: "Blazing Fast Performance",
    description:
      "Built on Deno and Fresh, your store loads instantly and provides a seamless shopping experience for your customers.",
    icon: BoltIcon,
  },
  {
    name: "Global Scale",
    description:
      "Ready for international markets with built-in support for multiple currencies, languages, and regional tax compliance.",
    icon: GlobeIcon,
  },
  {
    name: "Fair & Transparent",
    description:
      "No hidden fees or locked-in features. Full source control means you own your data and your customer relationships.",
    icon: ScaleIcon,
  },
];

export default function Features() {
  return (
    <div class="bg-gray-50 py-12 sm:py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="lg:text-center">
          <h2 class="text-base font-semibold uppercase tracking-wide text-indigo-600">
            Features
          </h2>
          <p class="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to sell online
          </p>
          <p class="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            A comprehensive suite of tools designed to help you build, launch,
            and grow your online business with ease.
          </p>
        </div>

        <div class="mt-10">
          <dl class="space-y-10 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 md:space-y-0 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} class="relative">
                <dt>
                  <div class="absolute flex h-12 w-12 items-center justify-center rounded-md bg-indigo-500 text-white">
                    <feature.icon class="h-6 w-6" />
                  </div>
                  <p class="ml-16 text-lg font-medium leading-6 text-gray-900">
                    {feature.name}
                  </p>
                </dt>
                <dd class="mt-2 ml-16 text-base text-gray-500">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
