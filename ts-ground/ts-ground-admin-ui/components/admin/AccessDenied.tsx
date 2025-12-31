/**
 * Access Denied Component
 * Shows when user is authenticated but lacks permissions (403 Forbidden)
 * Following Rails-style RBAC error handling
 */

interface AccessDeniedProps {
  message?: string;
  entityName?: string;
}

export function AccessDenied({ message, entityName }: AccessDeniedProps) {
  const defaultMessage = entityName
    ? `You don't have permission to access ${entityName}`
    : "You don't have permission to access this resource";

  return (
    <div class="min-h-[60vh] flex items-center justify-center">
      <div class="card w-full max-w-lg bg-base-100 shadow-2xl">
        <div class="card-body items-center text-center space-y-4">
          {/* Icon */}
          <div class="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-10 w-10 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 class="card-title text-2xl font-bold text-error">
            Access Denied
          </h2>

          {/* Message */}
          <p class="text-base-content/70 max-w-md">
            {message || defaultMessage}
          </p>

          {/* Additional Info */}
          <div class="alert alert-warning">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="text-left text-sm">
              <p class="font-semibold">This page is restricted</p>
              <p class="text-xs opacity-80">
                Contact your administrator if you believe this is an error
              </p>
            </div>
          </div>

          {/* Actions */}
          <div class="card-actions flex-col sm:flex-row gap-2 mt-4 w-full">
            <a href="/" class="btn btn-outline flex-1">
              Go to Homepage
            </a>
            <a href="/admin/articles" class="btn btn-primary flex-1">
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
