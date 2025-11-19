#!/usr/bin/env -S deno run --allow-all

/**
 * Complete Test Setup Script
 *
 * This script automates test database setup:
 * 1. Creates test database
 * 2. Runs migrations
 * 3. Validates database connection
 *
 * Note: Test data (users, etc.) is created by individual test suites
 * using beforeAll/afterAll hooks for proper isolation.
 *
 * Usage: deno run --allow-all scripts/setup-test-full.ts
 */

import { loadSync } from "@std/dotenv";
import { sql } from "drizzle-orm";

// Load test environment (Deno-style)
Deno.env.set("ENVIRONMENT", "test");
loadSync({ envPath: ".env.test", export: true });

console.log("🧪 TonyStack Test Setup");
console.log("=".repeat(50));

// Step 1: Create test database
console.log("\n[INFO] Step 1: Creating test database...");
try {
  const createDb = new Deno.Command("deno", {
    args: ["run", "--allow-all", "scripts/setup-test-db.ts"],
    env: { ENVIRONMENT: "test" },
  });
  const { success: createSuccess } = await createDb.output();

  if (!createSuccess) {
    console.error("[ERROR] Failed to create test database");
    Deno.exit(1);
  }
  console.log("[SUCCESS] Test database created successfully");
} catch (error) {
  console.error(
    "[ERROR] Error creating test database:",
    error instanceof Error ? error.message : String(error),
  );
  Deno.exit(1);
}

// Step 2: Run migrations
console.log("\n🔄 Step 2: Running migrations...");
try {
  const migrate = new Deno.Command("deno", {
    args: [
      "run",
      "-A",
      "--node-modules-dir",
      "npm:drizzle-kit@0.28.0",
      "migrate",
    ],
    env: { ENVIRONMENT: "test" },
  });
  const { success: migrateSuccess } = await migrate.output();

  if (!migrateSuccess) {
    console.error("[ERROR] Failed to run migrations");
    Deno.exit(1);
  }
  console.log("[SUCCESS] Migrations completed successfully");
} catch (error) {
  console.error(
    "[ERROR] Error running migrations:",
    error instanceof Error ? error.message : String(error),
  );
  Deno.exit(1);
}

// Step 3: Validate setup
console.log("\n[INFO] Step 3: Validating setup...");
try {
  // Import database to test connection
  const { db } = await import("../src/config/database.ts");

  // Simple query to verify database is accessible
  const result = await db.execute(sql`SELECT 1 as test`);

  if (!result || result.length === 0) {
    console.error("[ERROR] Database connection validation failed");
    Deno.exit(1);
  }

  console.log("[SUCCESS] Setup validation passed");

  // Close database connection
  await db.$client.end();
} catch (error) {
  console.error(
    "[ERROR] Setup validation failed:",
    error instanceof Error ? error.message : String(error),
  );
  Deno.exit(1);
}

console.log("\n" + "=".repeat(50));
console.log("[SUCCESS] Test environment setup complete!");
console.log("");
console.log("📋 Ready to run:");
console.log("   • Database created and migrated");
console.log("   • Tests will create their own data (beforeAll/afterAll)");
console.log("");
console.log("[INFO] Next:");
console.log("   deno task test          # Run tests");
console.log("   deno task test:watch    # Watch mode");
console.log("");

Deno.exit(0);
