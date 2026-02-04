/**
 * API Client for tstack-kit backend
 * Handles authenticated requests with JWT tokens
 */

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Get API base URL from environment or default to localhost
const API_BASE_URL = typeof Deno !== "undefined"
  ? Deno.env.get("API_BASE_URL") || "http://localhost:8000"
  : "http://localhost:8000";

// For SSR, prefer internal Docker network to avoid public URL roundtrip
// This prevents timeout issues when frontend containers call API via external URL
const API_INTERNAL_URL = typeof Deno !== "undefined"
  ? Deno.env.get("API_INTERNAL_URL")
  : undefined;
const SSR_API_URL = API_INTERNAL_URL || API_BASE_URL;

export class ApiClient implements Record<string, unknown> {
  private baseUrl: string;
  private token: string | null;
  [key: string]: unknown;

  constructor(
    baseUrl: string = API_BASE_URL,
    token: string | null = null,
  ) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null): void {
    this.token = token;
  }

  /**
   * Make authenticated request
   */
  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add existing headers
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.assign(headers, existingHeaders);
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const data = await response.json();
        error.message = data.message || data.error || error.message;
        error.errors = data.errors;
      } catch {
        // Response not JSON
      }

      throw error;
    }

    return response.json();
  }

  /**
   * GET request
   */
  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  /**
   * POST request
   */
  post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  put<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  patch<T>(path: string, data: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Create API client with specific token (for server-side use)
 * Uses SSR_API_URL for internal Docker networking performance
 */
export function createApiClient(token: string | null): ApiClient {
  return new ApiClient(SSR_API_URL, token);
}

// Export API_BASE_URL for use in other modules (client-side)
// Export SSR_API_URL for server-side rendering
export { API_BASE_URL, SSR_API_URL };
