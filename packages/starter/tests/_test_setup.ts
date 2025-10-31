/**
 * Test Setup - runs before all tests
 *
 * This file:
 * 1. Sets up test database
 * 2. Runs migrations
 * 3. Prepares test environment
 *
 * Deno automatically runs files matching _test_setup.ts before tests
 */

import { config } from "../src/config/env.ts";

console.log("\n🧪 Setting up test environment...\n");
console.log(`   NODE_ENV: ${config.nodeEnv}`);
console.log(`   Database: ${config.databaseUrl}`);
console.log(`   Port: ${config.port}\n`);

// Verify we're in test mode
if (config.nodeEnv !== "test") {
  console.error("❌ ERROR: Tests must run with NODE_ENV=test");
  console.error(`   Current NODE_ENV: ${config.nodeEnv}`);
  console.error(`   Run: NODE_ENV=test deno task test`);
  Deno.exit(1);
}

console.log("📊 Running migrations on test database...");

// Run migrations using drizzle-kit directly
const migrateCmd = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    "--node-modules-dir",
    "npm:drizzle-kit@0.28.0",
    "migrate",
  ],
  env: {
    ...Deno.env.toObject(),
    NODE_ENV: "test",
  },
  stdout: "inherit", // Show migration output
  stderr: "inherit",
});

const migrateResult = await migrateCmd.output();

if (!migrateResult.success) {
  console.error("\n❌ Migration failed!");
  console.error("   Make sure test database exists: deno task test:setup");
  Deno.exit(1);
}

console.log("\n✅ Test environment ready");
console.log("🚀 Running tests...\n");
