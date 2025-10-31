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

import { config } from "./config/env.ts";

console.log("\n Setting up test environment...\n");
console.log(`   ENVIRONMENT: ${config.environment}`);
console.log(`   Database: ${config.databaseUrl}`);
console.log(`   Port: ${config.port}\n`);

// Verify we're in test mode
if (config.environment !== "test") {
  console.error("[ERROR] ERROR: Tests must run with ENVIRONMENT=test");
  console.error(`   Current ENVIRONMENT: ${config.environment}`);
  console.error(`   Run: ENVIRONMENT=test deno task test`);
  Deno.exit(1);
}

console.log(" Running migrations on test database...");

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
    ENVIRONMENT: "test",
  },
  stdout: "inherit", // Show migration output
  stderr: "inherit",
});

const migrateResult = await migrateCmd.output();

if (!migrateResult.success) {
  console.error("\n[ERROR] Migration failed!");
  console.error("   Make sure test database exists: deno task test:setup");
  Deno.exit(1);
}

// Seed superadmin for auth tests
console.log("\n[SEED] Seeding superadmin for auth tests...");

// Get project root (parent of src/)
const projectRoot = new URL("../", import.meta.url).pathname;

const seedCmd = new Deno.Command("deno", {
  args: ["run", "--allow-all", "scripts/seed-superadmin.ts"],
  env: {
    ...Deno.env.toObject(),
    ENVIRONMENT: "test",
  },
  stdout: "piped",
  stderr: "piped",
  cwd: projectRoot,
});

const seedResult = await seedCmd.output();

if (seedResult.success) {
  console.log("[OK] Superadmin seeded (or already exists)");
} else {
  const stderr = new TextDecoder().decode(seedResult.stderr);
  if (stderr.includes("already exists") || stderr.includes("duplicate")) {
    console.log("[OK] Superadmin already exists");
  } else {
    console.warn(
      "[WARNING]  Superadmin seeding failed (may not be needed for all tests)",
    );
  }
}

// Seed alpha user for article tests
console.log("[SEED] Seeding alpha user for article tests...");

const seedAlphaCmd = new Deno.Command("deno", {
  args: ["run", "--allow-all", "scripts/seed-alpha-user.ts"],
  env: {
    ...Deno.env.toObject(),
    ENVIRONMENT: "test",
  },
  stdout: "piped",
  stderr: "piped",
  cwd: projectRoot,
});

const seedAlphaResult = await seedAlphaCmd.output();

if (seedAlphaResult.success) {
  console.log("[OK] Alpha user seeded (or already exists)");
} else {
  const stderr = new TextDecoder().decode(seedAlphaResult.stderr);
  if (stderr.includes("already exists") || stderr.includes("duplicate")) {
    console.log("[OK] Alpha user already exists");
  } else {
    console.warn(
      "[WARNING]  Alpha user seeding failed (may not be needed for all tests)",
    );
  }
}

console.log("\n[SUCCESS] Test environment ready");
console.log(" Running tests...\n");
