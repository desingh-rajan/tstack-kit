/**
 * Test Database Setup Script
 * 
 * This script:
 * 1. Creates the test database if it doesn't exist
 * 2. Runs all migrations on the test database
 * 3. Seeds initial test data (optional)
 * 
 * Run before tests: NODE_ENV=test deno run --allow-all scripts/setup-test-db.ts
 */

import { config } from "../src/config/env.ts";
import postgres from "postgres";

async function setupTestDatabase() {
  console.log("🧪 Setting up test database...\n");

  // Extract database name from connection string
  const dbUrl = new URL(config.databaseUrl);
  const testDbName = dbUrl.pathname.substring(1); // Remove leading /
  const baseDbUrl = `postgresql://${dbUrl.username}:${dbUrl.password}@${dbUrl.host}${dbUrl.port ? `:${dbUrl.port}` : ""}/postgres`;

  console.log(`   Database: ${testDbName}`);
  console.log(`   Environment: ${config.nodeEnv}\n`);

  // Connect to postgres database to create test db
  const adminSql = postgres(baseDbUrl, { max: 1 });

  try {
    // Drop existing test database if exists
    console.log("   Dropping existing test database (if exists)...");
    await adminSql.unsafe(`DROP DATABASE IF EXISTS "${testDbName}"`);
    console.log("   ✓ Dropped");

    // Create fresh test database
    console.log("   Creating test database...");
    await adminSql.unsafe(`CREATE DATABASE "${testDbName}"`);
    console.log("   ✓ Created\n");
  } catch (error) {
    console.error("   ❌ Error setting up test database:");
    console.error("   ", error);
    Deno.exit(1);
  } finally {
    await adminSql.end();
  }

  console.log("✅ Test database setup complete!\n");
  console.log("Next steps:");
  console.log("  1. Run migrations: NODE_ENV=test deno task migrate:run");
  console.log("  2. Run tests: NODE_ENV=test deno test --allow-all tests/\n");
}

if (import.meta.main) {
  await setupTestDatabase();
}
