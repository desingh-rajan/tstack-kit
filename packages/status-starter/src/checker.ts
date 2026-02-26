import { config } from "./config.ts";

/**
 * Service check result
 */
export interface CheckResult {
  name: string;
  url: string;
  ok: boolean;
  latencyMs: number;
  checkedAt: string;
  detail?: string;
  database?: string;
}

/**
 * Check a single service's /health endpoint
 * Returns structured result with latency measurement
 */
export async function checkService(
  name: string,
  url: string,
): Promise<CheckResult> {
  const start = performance.now();
  const checkedAt = new Date().toISOString();

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(config.checkTimeoutMs),
    });

    const latencyMs = Math.round(performance.now() - start);

    if (!response.ok) {
      return {
        name,
        url,
        ok: false,
        latencyMs,
        checkedAt,
        detail: `HTTP ${response.status}`,
      };
    }

    // Try to parse JSON body for richer detail
    try {
      const body = await response.json();
      const database = body?.data?.database || body?.database;
      return {
        name,
        url,
        ok: true,
        latencyMs,
        checkedAt,
        detail: body?.data?.status || body?.status || "OK",
        database: database || undefined,
      };
    } catch {
      return { name, url, ok: true, latencyMs, checkedAt, detail: "OK" };
    }
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    const detail = error instanceof DOMException && error.name === "AbortError"
      ? "Timeout"
      : error instanceof Error
      ? error.message
      : "Unknown error";

    return { name, url, ok: false, latencyMs, checkedAt, detail };
  }
}

/**
 * Build the list of services to monitor from config
 */
export function getMonitoredServices(): { name: string; url: string }[] {
  const services: { name: string; url: string }[] = [];

  if (config.apiUrl) {
    services.push({ name: "API", url: `${config.apiUrl}/health` });
  }
  if (config.storefrontUrl) {
    services.push({
      name: "Storefront",
      url: `${config.storefrontUrl}/health`,
    });
  }
  if (config.adminUrl) {
    services.push({ name: "Admin UI", url: `${config.adminUrl}/health` });
  }

  return services;
}
