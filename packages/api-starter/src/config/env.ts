/**
 * Environment Configuration Loader
 *
 * Loads environment variables from files based on ENVIRONMENT:
 * - ENVIRONMENT=development → .env.development.local or .env
 * - ENVIRONMENT=test → .env.test.local
 * - ENVIRONMENT=production → .env.production.local
 *
 * Priority: System env vars > .env.{ENVIRONMENT}.local > .env
 */

import { load } from "@std/dotenv";

// Determine which env file to load based on ENVIRONMENT
const environment = Deno.env.get("ENVIRONMENT") || "development";
const envFiles = [
  `.env.${environment}.local`, // Environment-specific (preferred)
  ".env", // Fallback to generic .env
];

// Try to load environment file (skip if not found)
let envLoaded = false;
for (const envFile of envFiles) {
  try {
    const envVars = await load({ envPath: envFile, export: true });
    if (Object.keys(envVars).length > 0) {
      envLoaded = true;
      if (environment === "development") {
        console.log(`[OK] Loaded environment from ${envFile}`);
      }
      break;
    }
  } catch {
    // File doesn't exist, try next
  }
}

if (!envLoaded && environment === "development") {
  console.warn(
    "[WARNING]  No .env file found, using system environment variables",
  );
}

export interface Config {
  environment: string;
  port: number;
  databaseUrl: string;
  allowedOrigins: string[];
}

function loadConfig(): Config {
  const databaseUrl = Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    console.error("[ERROR] DATABASE_URL environment variable is required");
    console.error(
      "   Expected files: .env.${environment}.local or .env",
    );
    console.error(
      "   Current ENVIRONMENT: " + environment,
    );
    Deno.exit(1);
  }

  return {
    environment,
    port: parseInt(Deno.env.get("PORT") || "8000", 10),
    databaseUrl,
    allowedOrigins: (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
  };
}

export const config = loadConfig();
export const isDevelopment = config.environment === "development";
export const isProduction = config.environment === "production";
export const isTest = config.environment === "test";
