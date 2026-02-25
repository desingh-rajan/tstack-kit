import { useSignal } from "@preact/signals";

interface ContactData {
  name: string;
  email: string;
  message: string;
}

export default function ContactForm() {
  const isSubmitting = useSignal(false);
  const isSuccess = useSignal(false);
  const error = useSignal<string | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const firstName = (formData.get("first-name") ?? "").toString();
    const lastName = (formData.get("last-name") ?? "").toString();
    const name = [firstName, lastName].filter(Boolean).join(" ");

    const data: ContactData = {
      name,
      email: (formData.get("email") ?? "").toString(),
      message: (formData.get("message") ?? "").toString(),
    };

    // Validate
    if (!data.email) {
      error.value = "Email is required";
      return;
    }
    if (!data.message) {
      error.value = "Message is required";
      return;
    }

    isSubmitting.value = true;
    error.value = null;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        isSuccess.value = true;
        form.reset();
      } else {
        error.value = result.message || "Failed to submit. Please try again.";
      }
    } catch (_err) {
      error.value = "Network error. Please try again later.";
    } finally {
      isSubmitting.value = false;
    }
  };

  if (isSuccess.value) {
    return (
      <div class="mx-auto max-w-xl text-center py-12">
        <div class="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg
            class="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-2">Thank you!</h3>
        <p class="text-gray-600 mb-6">
          Your message has been received. We'll get back to you soon.
        </p>
        <button
          type="button"
          onClick={() => {
            isSuccess.value = false;
          }}
          class="text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="mx-auto mt-16 max-w-xl sm:mt-20">
      <div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        <div>
          <label
            for="first-name"
            class="block text-sm font-semibold leading-6 text-gray-900"
          >
            First name
          </label>
          <div class="mt-2.5">
            <input
              type="text"
              name="first-name"
              id="first-name"
              autocomplete="given-name"
              class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div>
          <label
            for="last-name"
            class="block text-sm font-semibold leading-6 text-gray-900"
          >
            Last name
          </label>
          <div class="mt-2.5">
            <input
              type="text"
              name="last-name"
              id="last-name"
              autocomplete="family-name"
              class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div class="sm:col-span-2">
          <label
            for="email"
            class="block text-sm font-semibold leading-6 text-gray-900"
          >
            Email
          </label>
          <div class="mt-2.5">
            <input
              type="email"
              name="email"
              id="email"
              autocomplete="email"
              required
              class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
        <div class="sm:col-span-2">
          <label
            for="message"
            class="block text-sm font-semibold leading-6 text-gray-900"
          >
            Message
          </label>
          <div class="mt-2.5">
            <textarea
              name="message"
              id="message"
              rows={4}
              required
              class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </div>

      {error.value && (
        <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{error.value}</p>
        </div>
      )}

      <div class="mt-10">
        <button
          type="submit"
          disabled={isSubmitting.value}
          class="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting.value ? "Sending..." : "Let's talk"}
        </button>
      </div>
    </form>
  );
}
