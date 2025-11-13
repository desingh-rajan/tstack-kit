/**
 * View utilities
 *
 * Common utility functions for rendering views safely.
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 *
 * @param unsafe - String that may contain unsafe HTML characters
 * @returns HTML-escaped string safe for rendering
 *
 * @example
 * ```typescript
 * escapeHtml("<script>alert('xss')</script>")
 * // Returns: "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
 * ```
 */
export function escapeHtml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) {
    return "";
  }

  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
