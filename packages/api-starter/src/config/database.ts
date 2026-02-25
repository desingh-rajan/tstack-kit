import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { config } from "./env.ts";

// Initialize PostgreSQL connection with pool limits
const poolSize = parseInt(Deno.env.get("DB_POOL_SIZE") || "20", 10) || 20;
const client = postgres(config.databaseUrl, {
  max: poolSize, // Maximum number of connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Close connections after 30 minutes
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
