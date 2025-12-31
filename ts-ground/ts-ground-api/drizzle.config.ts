/**
 * Drizzle Kit Configuration
 *
 * This config is used by drizzle-kit commands:
 * - deno task migrate:generate
 * - deno task migrate:run
 * - deno task db:studio
 *
 * Environment loading:
 * - Loads from .env.{ENVIRONMENT}.local based on ENVIRONMENT
 * - Falls back to DATABASE_URL env var
 *
 * Usage:
 * - Development: deno task migrate:run
 * - Test: ENVIRONMENT=test deno task migrate:run
 * - Production: ENVIRONMENT=production deno task migrate:run
 */

import * as fs from "node:fs";
import process from "node:process";

// Simple .env file parser
function loadEnvFile(filePath: string): Record<string, string> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const env: Record<string, string> = {};

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        let value = valueParts.join("=").trim();
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, "");
        env[key.trim()] = value;
      }
    }
    return env;
  } catch {
    return {};
  }
}

// Load environment variables (Deno.env.get() fallback for when running with Deno)
const environment = process.env.ENVIRONMENT ||
  (typeof Deno !== "undefined" ? Deno.env.get("ENVIRONMENT") : undefined) ||
  "development";
const envFiles = [`.env.${environment}.local`, ".env"];

for (const envFile of envFiles) {
  const envVars = loadEnvFile(envFile);
  if (Object.keys(envVars).length > 0) {
    Object.assign(process.env, envVars);
    break;
  }
}

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error(
    "[ERROR] DATABASE_URL environment variable is required for migrations",
  );
  console.error(`   Current ENVIRONMENT: ${environment}`);
  console.error(
    `   Expected file: .env.${environment}.local or .env`,
  );
  process.exit(1);
}

export default {
  schema: ["./src/entities/*/*.model.ts", "./src/auth/*.model.ts"],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
};
