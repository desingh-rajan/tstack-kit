/**
 * Drizzle Kit Configuration
 *
 * This config is used by drizzle-kit commands:
 * - deno task migrate:generate
 * - deno task migrate:run
 * - deno task db:studio
 *
 * Environment loading:
 * - Loads from .env.{NODE_ENV}.local based on NODE_ENV
 * - Falls back to DATABASE_URL env var
 *
 * Usage:
 * - Development: deno task migrate:run
 * - Test: NODE_ENV=test deno task migrate:run
 * - Production: NODE_ENV=production deno task migrate:run
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

// Load environment variables
const nodeEnv = process.env.NODE_ENV || "development";
const envFiles = [`.env.${nodeEnv}.local`, ".env"];

for (const envFile of envFiles) {
  const envVars = loadEnvFile(envFile);
  if (Object.keys(envVars).length > 0) {
    Object.assign(process.env, envVars);
    break;
  }
}

export default {
  schema: ["./src/entities/*/*.model.ts", "./src/auth/*.model.ts"],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ||
      "postgresql://postgres:password@localhost:5432/tonystack",
  },
  verbose: true,
  strict: true,
};
