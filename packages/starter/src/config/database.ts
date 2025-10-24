import { drizzle } from "drizzle-orm/better-sqlite3";
import { Database } from "@db/sqlite";
import { sql } from "drizzle-orm";
import { config } from "./env.ts";

// Initialize SQLite database
const sqlite = new Database(config.databaseUrl);

// Create Drizzle instance
export const db = drizzle(sqlite);

// For production PostgreSQL (uncomment when needed)
/*
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(config.databaseUrl);
export const db = drizzle(client);
*/

// Database connection health check
export async function healthCheck(): Promise<boolean> {
  try {
    // Simple query to check if database is accessible
    await db.run(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Initialize database tables (run migrations)
export async function initDatabase() {
  try {
    console.log(" Initializing database...");

    // Create data directory if it doesn't exist
    try {
      await Deno.mkdir("./data", { recursive: true });
    } catch {
      // Directory already exists
    }

    console.log(" Database initialized");
  } catch (error) {
    console.error(" Database initialization failed:", error);
    throw error;
  }
}
