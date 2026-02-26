/**
 * Status page configuration
 * All values are read from environment variables with sensible defaults.
 */
export const config = {
  /** Port the status page listens on */
  port: parseInt(Deno.env.get("PORT") || "8001", 10),

  /** How often to poll services (in seconds) */
  checkIntervalSeconds: parseInt(
    Deno.env.get("CHECK_INTERVAL_SECONDS") || "60",
    10,
  ),

  /** Timeout for each service health check (ms) */
  checkTimeoutMs: parseInt(Deno.env.get("CHECK_TIMEOUT_MS") || "5000", 10),

  /** How many days of history to keep in KV */
  historyDays: parseInt(Deno.env.get("HISTORY_DAYS") || "90", 10),

  /** Service base URLs to monitor */
  apiUrl: Deno.env.get("API_URL") || "http://localhost:8000",
  storefrontUrl: Deno.env.get("STOREFRONT_URL") || "http://localhost:3000",
  adminUrl: Deno.env.get("ADMIN_URL") || "http://localhost:3001",

  /**
   * Health check paths per service.
   * Defaults to /health. Override when a service uses a different path.
   * In production the API is behind kamal-proxy which strips the path prefix,
   * so /health works for all services regardless of the proxy prefix.
   */
  apiHealthPath: Deno.env.get("API_HEALTH_PATH") || "/health",
  storefrontHealthPath: Deno.env.get("STOREFRONT_HEALTH_PATH") || "/health",
  adminHealthPath: Deno.env.get("ADMIN_HEALTH_PATH") || "/health",

  /** Display title for the status page */
  siteTitle: Deno.env.get("SITE_TITLE") || "TStack Status",

  /** Current environment */
  environment: Deno.env.get("ENVIRONMENT") || "development",
};
