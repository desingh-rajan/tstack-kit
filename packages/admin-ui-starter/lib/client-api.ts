/**
 * Client-side API utilities
 * Handles browser-based API calls with automatic token from cookies
 */

/**
 * DELETE request helper
 * Makes request to frontend DELETE endpoint which proxies to backend with auth
 */
export async function deleteApi(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      console.error("DELETE failed:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("DELETE error:", error);
    return false;
  }
}
