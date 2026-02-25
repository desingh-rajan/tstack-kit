import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { config } from "./env.ts";

// Initialize PostgreSQL connection with pool limits
// All values can be tuned via environment variables for different deployment sizes.
const poolSize = parseInt(Deno.env.get("DB_POOL_SIZE") || "20", 10) || 20;
const idleTimeout = parseInt(Deno.env.get("DB_IDLE_TIMEOUT") || "20", 10) || 20;
const connectTimeout =
  parseInt(Deno.env.get("DB_CONNECT_TIMEOUT") || "10", 10) || 10;
const maxLifetime =
  parseInt(Deno.env.get("DB_MAX_LIFETIME") || String(60 * 30), 10) || 60 * 30;
const client = postgres(config.databaseUrl, {
  max: poolSize, // DB_POOL_SIZE — max connections in pool (default: 20)
  idle_timeout: idleTimeout, // DB_IDLE_TIMEOUT — close idle connections after N seconds (default: 20)
  connect_timeout: connectTimeout, // DB_CONNECT_TIMEOUT — connection timeout in seconds (default: 10)
  max_lifetime: maxLifetime, // DB_MAX_LIFETIME — close connections after N seconds (default: 1800)
});

// Create Drizzle instance with automatic camelCase to snake_case conversion
// @ts-ignore - casing option exists but may not be in current type definitions
export const db = drizzle(client, {
  casing: "snake_case",
});

// Database connection health check
export async function healthCheck(): Promise<boolean> {
  try {
    // Simple query to check if database is accessible
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Initialize database (run on startup)
export async function initDatabase() {
  try {
    console.log(" Initializing database...");

    // Test connection
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      throw new Error("Database connection failed");
    }

    console.log(" Database initialized");
  } catch (error) {
    console.error(" Database initialization failed:", error);
    throw error;
  }
}
