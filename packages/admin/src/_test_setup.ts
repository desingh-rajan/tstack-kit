/**
 * Test Setup for @tstack/admin
 *
 * Sets up test database connection by loading environment from starter project.
 * Creates test tables before tests run.
 * Runs before all tests.
 */

import { load } from "@std/dotenv";
import postgres from "postgres";

// Verify we're in test mode
const environment = Deno.env.get("ENVIRONMENT") || "test";

if (environment !== "test") {
  console.error("[ERROR] Tests must run with ENVIRONMENT=test");
  console.error(`   Current ENVIRONMENT: ${environment}`);
  console.error(`   Run: ENVIRONMENT=test deno task test`);
  Deno.exit(1);
}

// Try to load .env.test.local from starter directory
const starterEnvPath = new URL("../../starter/.env.test.local", import.meta.url)
  .pathname;

try {
  await load({ envPath: starterEnvPath, export: true });
  console.log(`\n🧪 @tstack/admin Test Setup`);
  console.log(`   Environment: ${environment}`);
  console.log(`   Database: ${Deno.env.get("DATABASE_URL")}\n`);
} catch {
  // Fallback: try to use system environment
  const databaseUrl = Deno.env.get("DATABASE_URL");
  if (!databaseUrl) {
    console.error("\n❌ DATABASE_URL is required for tests");
    console.error("\nOptions:");
    console.error("  1. Create ../starter/.env.test.local with:");
    console.error(
      "     DATABASE_URL=postgresql://tonystack:password@localhost:5432/tonystack_test_db",
    );
    console.error("\n  2. Or set DATABASE_URL environment variable");
    Deno.exit(1);
  }
  console.log(`\n🧪 @tstack/admin Test Setup`);
  console.log(`   Using DATABASE_URL from environment\n`);
}

// Create test tables
const connectionString = Deno.env.get("DATABASE_URL");
if (connectionString) {
  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log("   Creating test tables...");

    // Drop existing tables
    await sql`DROP TABLE IF EXISTS test_admin_products CASCADE`;
    await sql`DROP TABLE IF EXISTS test_admin_users_uuid CASCADE`;

    // Create test tables
    await sql`
      CREATE TABLE test_admin_products (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE test_admin_users_uuid (
        uuid TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        username TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    console.log("   ✅ Test tables created\n");
  } catch (error) {
    console.error("   ❌ Error creating test tables:", error);
    Deno.exit(1);
  } finally {
    await sql.end();
  }
}

console.log("✅ Test environment ready");
console.log("   Running tests...\n");
