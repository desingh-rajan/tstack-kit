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
 */

import { load } from "@std/dotenv";

// Load environment variables before config
const nodeEnv = Deno.env.get("NODE_ENV") || "development";
const envFiles = [`.env.${nodeEnv}.local`, ".env"];

for (const envFile of envFiles) {
  try {
    await load({ envPath: envFile, export: true });
    break;
  } catch {
    // Try next file
  }
}

export default {
  schema: ["./src/entities/*/*.model.ts", "./src/auth/*.model.ts"],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: Deno.env.get("DATABASE_URL") ||
      "postgresql://postgres:password@localhost:5432/tonystack",
  },
  verbose: true,
  strict: true,
};
