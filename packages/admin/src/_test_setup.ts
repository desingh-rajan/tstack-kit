/**
 * Test Setup for @tstack/admin
 *
 * Sets up test database connection by loading environment from starter project.
 * Creates test tables before tests run.
 * Runs before all tests.
 */

import postgres from "postgres";

// Verify we're in test mode
const environment = Deno.env.get("ENVIRONMENT") || "test";

if (environment !== "test") {
  console.error("[ERROR] Tests must run with ENVIRONMENT=test");
  console.error(`   Current ENVIRONMENT: ${environment}`);
  console.error(`   Run: ENVIRONMENT=test deno task test`);
  Deno.exit(1);
}

// Admin package uses its own test database
const adminTestDb = "tstack_admin_test";
const dbUser = Deno.env.get("PGUSER") || "postgres";
const dbPassword = Deno.env.get("PGPASSWORD") || "password";
const connectionString =
  `postgresql://${dbUser}:${dbPassword}@localhost:5432/${adminTestDb}`;

// Set DATABASE_URL for tests that expect it
Deno.env.set("DATABASE_URL", connectionString);

console.log(`\n🧪 @tstack/admin Test Setup`);
console.log(`   Environment: ${environment}`);
console.log(`   Database: ${connectionString}\n`);

// Helper: Create database if it doesn't exist
async function ensureDatabase(dbName: string): Promise<void> {
  try {
    // Try to create database using PGPASSWORD
    const cmd = new Deno.Command("psql", {
      args: [
        "-U",
        dbUser,
        "-h",
        "localhost",
        "-d",
        "postgres",
        "-c",
        `CREATE DATABASE ${dbName}`,
      ],
      env: { PGPASSWORD: dbPassword },
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stderr } = await cmd.output();
    const errorOutput = new TextDecoder().decode(stderr);

    if (success) {
      console.log(`   [SUCCESS] Database "${dbName}" created`);
    } else if (errorOutput.includes("already exists")) {
      console.log(`     Database "${dbName}" already exists`);
    } else {
      console.error(`   [WARNING]  Could not verify database "${dbName}"`);
    }
  } catch (error) {
    console.error(`   [WARNING]  Database check failed:`, error);
  }
}

// Create test tables
// Use the admin test database connectionString
const dbName = "tstack_admin_test";

// Ensure database exists
console.log("   Ensuring test database exists...");
await ensureDatabase(dbName);

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

  console.log("   [SUCCESS] Test tables created\n");
} catch (error) {
  console.error("   [ERROR] Error creating test tables:", error);
  Deno.exit(1);
} finally {
  await sql.end();
}

console.log("[SUCCESS] Test environment ready");
console.log("   Running tests...\n");
