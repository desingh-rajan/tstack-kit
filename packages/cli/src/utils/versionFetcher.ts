import { Logger } from "./logger.ts";

export interface DependencyVersion {
  name: string;
  version: string;
  registry: "jsr" | "npm";
}

interface VersionCache {
  [key: string]: {
    version: string;
    timestamp: number;
  };
}

// Cache versions for 1 hour to avoid rate limits
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const versionCache: VersionCache = {};

/**
 * Fetch the latest stable version from JSR registry
 */
async function fetchJSRVersion(packageName: string): Promise<string | null> {
  try {
    // Check cache first
    const cacheKey = `jsr:${packageName}`;
    const cached = versionCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.version;
    }

    const response = await fetch(`https://jsr.io/${packageName}/meta.json`, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      await response.body?.cancel(); // Clean up response body
      return null;
    }

    const data = await response.json();
    const latestVersion = data.latest;

    if (latestVersion) {
      // Cache the version
      versionCache[cacheKey] = {
        version: latestVersion,
        timestamp: Date.now(),
      };
      return latestVersion;
    }

    return null;
  } catch (error) {
    if (Deno.env.get("DEBUG")) {
      Logger.warning(
        `Failed to fetch JSR version for ${packageName}: ${error}`,
      );
    }
    return null;
  }
}

/**
 * Fetch the latest stable version from npm registry
 */
async function fetchNPMVersion(packageName: string): Promise<string | null> {
  try {
    // Check cache first
    const cacheKey = `npm:${packageName}`;
    const cached = versionCache[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.version;
    }

    const response = await fetch(
      `https://registry.npmjs.org/${packageName}/latest`,
      {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      },
    );

    if (!response.ok) {
      await response.body?.cancel(); // Clean up response body
      return null;
    }

    const data = await response.json();
    const latestVersion = data.version;

    if (latestVersion) {
      // Cache the version
      versionCache[cacheKey] = {
        version: latestVersion,
        timestamp: Date.now(),
      };
      return latestVersion;
    }

    return null;
  } catch (error) {
    if (Deno.env.get("DEBUG")) {
      Logger.warning(
        `Failed to fetch npm version for ${packageName}: ${error}`,
      );
    }
    return null;
  }
}

/**
 * Fetch the latest stable version for a dependency
 * Falls back to provided fallback version if fetch fails
 */
export async function fetchLatestVersion(
  registry: "jsr" | "npm",
  packageName: string,
  fallbackVersion: string,
): Promise<string> {
  let version: string | null = null;

  if (registry === "jsr") {
    version = await fetchJSRVersion(packageName);
  } else if (registry === "npm") {
    version = await fetchNPMVersion(packageName);
  }

  if (version) {
    return version;
  }

  // Fallback to provided version
  if (Deno.env.get("DEBUG")) {
    Logger.warning(
      `Using fallback version ${fallbackVersion} for ${packageName}`,
    );
  }
  return fallbackVersion;
}

/**
 * Fetch all latest versions for TonyStack dependencies
 */
export async function fetchAllLatestVersions(
  fallbackVersions: Record<string, string>,
): Promise<Record<string, string>> {
  Logger.step("Fetching latest stable versions from registries...");
  Logger.newLine();

  const dependencies = [
    // JSR packages
    { registry: "jsr" as const, name: "@std/dotenv", key: "@std/dotenv" },
    { registry: "jsr" as const, name: "@hono/hono", key: "hono" },
    // npm packages
    { registry: "npm" as const, name: "jose", key: "jose" },
    { registry: "npm" as const, name: "drizzle-orm", key: "drizzle-orm" },
    { registry: "npm" as const, name: "drizzle-kit", key: "drizzle-kit" },
    { registry: "npm" as const, name: "drizzle-zod", key: "drizzle-zod" },
    { registry: "npm" as const, name: "postgres", key: "postgres" },
    { registry: "npm" as const, name: "zod", key: "zod" },
  ];

  const results: Record<string, string> = {};

  // Fetch all versions in parallel
  const fetchPromises = dependencies.map(async (dep) => {
    const fallback = fallbackVersions[dep.key] || "latest";
    const version = await fetchLatestVersion(dep.registry, dep.name, fallback);
    results[dep.key] = version;
    Logger.info(`${dep.name}: ${version}`);
  });

  await Promise.all(fetchPromises);

  Logger.newLine();
  Logger.success("Version fetching complete!");
  Logger.newLine();

  return results;
}

/**
 * Extract version from import specifier (e.g., "jsr:@std/dotenv@^0.225.0" -> "0.225.0")
 */
export function extractVersion(specifier: string): string {
  const match = specifier.match(/@([\^~])?([0-9.]+)/);
  return match ? match[2] : "latest";
}
