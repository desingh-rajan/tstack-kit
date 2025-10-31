/**
 * Environment Configuration Loader
 *
 * Loads environment variables from files based on NODE_ENV:
 * - NODE_ENV=development → .env.development.local or .env
 * - NODE_ENV=test → .env.test.local
 * - NODE_ENV=production → .env.production.local
 *
 * Priority: System env vars > .env.{NODE_ENV}.local > .env
 */

import { load } from "@std/dotenv";

// Determine which env file to load based on NODE_ENV
const nodeEnv = Deno.env.get("NODE_ENV") || "development";
const envFiles = [
  `.env.${nodeEnv}.local`, // Environment-specific (preferred)
  ".env", // Fallback to generic .env
];

// Try to load environment file (skip if not found)
let envLoaded = false;
for (const envFile of envFiles) {
  try {
    const envVars = await load({ envPath: envFile, export: true });
    if (Object.keys(envVars).length > 0) {
      envLoaded = true;
      if (nodeEnv === "development") {
        console.log(`[OK] Loaded environment from ${envFile}`);
      }
      break;
    }
  } catch {
    // File doesn't exist, try next
  }
}

if (!envLoaded && nodeEnv === "development") {
  console.warn(
    "[WARNING]  No .env file found, using system environment variables",
  );
}

export interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  allowedOrigins: string[];
}

function loadConfig(): Config {
  const databaseUrl = Deno.env.get("DATABASE_URL");

  if (!databaseUrl) {
    console.error("[ERROR] DATABASE_URL environment variable is required");
    console.error(
      "   Expected files: .env.${nodeEnv}.local or .env",
    );
    console.error(
      "   Current NODE_ENV: " + nodeEnv,
    );
    Deno.exit(1);
  }

  return {
    nodeEnv,
    port: parseInt(Deno.env.get("PORT") || "8000", 10),
    databaseUrl,
    allowedOrigins: (Deno.env.get("ALLOWED_ORIGINS") || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim()),
  };
}

export const config = loadConfig();
export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";
export const isTest = config.nodeEnv === "test";
