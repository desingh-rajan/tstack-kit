/**
 * Global Test Setup
 *
 * This file runs ONCE before all test files.
 * It only ensures the database and migrations are ready.
 * Individual test suites handle their own data setup/teardown.
 *
 * Deno automatically runs files matching _test_setup.ts before tests.
 */

import { config } from "./config/env.ts";

// Get project root (parent of src/)
const projectRoot = new URL("../", import.meta.url).pathname;

console.log("\n🧪 Global Test Setup");
console.log("=".repeat(50));
console.log(`   ENVIRONMENT: ${config.environment}`);
console.log(`   Database: ${config.databaseUrl.split("@")[1]}`); // Hide credentials
console.log(`   Port: ${config.port}`);

// Verify we're in test mode
if (config.environment !== "test") {
  console.error("\n[ERROR] Tests must run with ENVIRONMENT=test");
  console.error(`   Current: ${config.environment}`);
  console.error(`   Run: ENVIRONMENT=test deno task test`);
  Deno.exit(1);
}

// Ensure test database exists
console.log("\n📦 Ensuring test database exists...");

const setupDbCmd = new Deno.Command("deno", {
  args: ["run", "--allow-all", "scripts/setup-test-db.ts"],
  env: {
    ...Deno.env.toObject(),
    ENVIRONMENT: "test",
  },
  stdout: "piped",
  stderr: "piped",
  cwd: projectRoot,
});

const setupDbResult = await setupDbCmd.output();

if (!setupDbResult.success) {
  const stderr = new TextDecoder().decode(setupDbResult.stderr);
  // Ignore "already exists" errors
  if (!stderr.includes("already exists") && !stderr.includes("duplicate")) {
    console.error("\n[ERROR] Database setup failed!");
    console.error(stderr);
    Deno.exit(1);
  }
}

console.log("✅ Test database ready");

// Run migrations
console.log("\n🔄 Running migrations...");

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
    ENVIRONMENT: "test",
  },
  stdout: "piped",
  stderr: "piped",
});

const migrateResult = await migrateCmd.output();

if (!migrateResult.success) {
  const stderr = new TextDecoder().decode(migrateResult.stderr);
  console.error("\n[ERROR] Migration failed!");
  console.error(stderr);
  Deno.exit(1);
}

console.log("✅ Migrations applied");

console.log("\n" + "=".repeat(50));
console.log(
  "✅ Global setup complete - test suites will handle their own data",
);
console.log("");
