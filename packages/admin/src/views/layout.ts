/**
 * Admin layout component
 *
 * Base HTML layout with Tailwind CSS and htmx.
 */

import type { ViewConfig } from "../core/types.ts";

export interface LayoutOptions {
  title: string;
  config: ViewConfig;
  currentUser?: {
    email: string;
    role: string;
  };
}

/**
 * Generate admin layout HTML
 *
 * @param content - Main content HTML
 * @param options - Layout options
 * @returns Full HTML page
 */
export function adminLayout(content: string, options: LayoutOptions): string {
  const { title, config, currentUser } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TStack Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <style>
    .htmx-indicator {
      display: none;
    }
    .htmx-request .htmx-indicator {
      display: inline;
    }
    .htmx-request.htmx-indicator {
      display: inline;
    }
  </style>
</head>
<body class="bg-gray-50">
  <!-- Navigation -->
  <nav class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/ts-admin" class="text-xl font-bold text-gray-900">
              TStack Admin
            </a>
          </div>
        </div>
        ${
    currentUser
      ? `
        <div class="flex items-center">
          <span class="text-sm text-gray-700">
            ${currentUser.email}
            <span class="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              ${currentUser.role}
            </span>
          </span>
        </div>
        `
      : ""
  }
      </div>
    </div>
  </nav>

  <!-- Main content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumbs -->
    <nav class="mb-4 text-sm" aria-label="Breadcrumb">
      <ol class="inline-flex items-center space-x-1 md:space-x-3">
        <li class="inline-flex items-center">
          <a href="/ts-admin" class="text-gray-600 hover:text-gray-900">
            Home
          </a>
        </li>
        <li>
          <div class="flex items-center">
            <span class="mx-2 text-gray-400">/</span>
            <span class="text-gray-900 font-medium">${config.entityNamePlural}</span>
          </div>
        </li>
      </ol>
    </nav>

    ${content}
  </main>

  <!-- Footer -->
  <footer class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 mt-8 border-t border-gray-200">
    <p class="text-center text-sm text-gray-500">
      TStack Admin - Built with ❤️ by <a href="https://github.com/desingh-rajan/tstack-kit" class="text-blue-600 hover:text-blue-800" target="_blank">TStack Kit</a>
    </p>
  </footer>
</body>
</html>`;
}
