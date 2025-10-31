#!/usr/bin/env -S deno run --allow-all

/**
 * Complete Test Setup Script
 *
 * This script automates the entire test setup process:
 * 1. Creates test database
 * 2. Runs migrations
 * 3. Seeds test data
 * 4. Validates setup
 *
 * Usage: deno run --allow-all scripts/setup-test-full.ts
 */

import { loadSync } from "@std/dotenv";

// Load test environment (Deno-style)
Deno.env.set("ENVIRONMENT", "test");
loadSync({ envPath: ".env.test", export: true });

console.log("🧪 TonyStack Test Setup");
console.log("=".repeat(50));

// Step 1: Create test database
console.log("\n📊 Step 1: Creating test database...");
try {
  const createDb = new Deno.Command("deno", {
    args: ["run", "--allow-all", "scripts/setup-test-db.ts"],
    env: { ENVIRONMENT: "test" },
  });
  const { success: createSuccess } = await createDb.output();

  if (!createSuccess) {
    console.error("❌ Failed to create test database");
    Deno.exit(1);
  }
  console.log("✅ Test database created successfully");
} catch (error) {
  console.error(
    "❌ Error creating test database:",
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
    console.error("❌ Failed to run migrations");
    Deno.exit(1);
  }
  console.log("✅ Migrations completed successfully");
} catch (error) {
  console.error(
    "❌ Error running migrations:",
    error instanceof Error ? error.message : String(error),
  );
  Deno.exit(1);
}

// Step 3: Seed test data
console.log("\n🌱 Step 3: Seeding test data...");
try {
  // Seed superadmin
  const seedSuper = new Deno.Command("deno", {
    args: ["run", "--allow-all", "scripts/seed-superadmin.ts"],
    env: { ENVIRONMENT: "test" },
  });
  const { success: seedSuperSuccess } = await seedSuper.output();

  if (!seedSuperSuccess) {
    console.error("❌ Failed to seed superadmin");
    Deno.exit(1);
  }

  // Seed alpha user
  const seedAlpha = new Deno.Command("deno", {
    args: ["run", "--allow-all", "scripts/seed-alpha-user.ts"],
    env: { ENVIRONMENT: "test" },
  });
  const { success: seedAlphaSuccess } = await seedAlpha.output();

  if (!seedAlphaSuccess) {
    console.error("❌ Failed to seed alpha user");
    Deno.exit(1);
  }

  console.log("✅ Test data seeded successfully");
} catch (error) {
  console.error(
    "❌ Error seeding test data:",
    error instanceof Error ? error.message : String(error),
  );
  Deno.exit(1);
}

// Step 4: Validate setup
console.log("\n🔍 Step 4: Validating setup...");
try {
  // Import database to test connection
  const { db } = await import("../src/config/database.ts");

  // Test query to verify setup
  const superadminEmail = Deno.env.get("SUPERADMIN_EMAIL") ||
    "test-admin@test.local";
  const alphaEmail = Deno.env.get("ALPHA_EMAIL");

  const expectedCount = alphaEmail ? 2 : 1;

  const users = await db.execute(
    `SELECT COUNT(*) as count FROM users WHERE email IN ('${superadminEmail}', '${alphaEmail}')`,
  );

  const userCount = Number(users[0].count);
  if (userCount !== expectedCount) {
    console.error(
      `❌ Expected ${expectedCount} test user(s), found ${userCount}`,
    );
    Deno.exit(1);
  }

  console.log("✅ Setup validation passed");

  // Close database connection
  await db.$client.end();
} catch (error) {
  console.error(
    "❌ Setup validation failed:",
    error instanceof Error ? error.message : String(error),
  );
  Deno.exit(1);
}

console.log("\n" + "=".repeat(50));
console.log("🎉 Test environment setup complete!");
console.log("");
console.log("📋 What's ready:");
console.log("   • Test database created and migrated");
console.log("   • Test users seeded (superadmin + alpha)");
console.log("   • All connections verified");
console.log("");
console.log("🚀 Next steps:");
console.log("   deno task test          # Run tests");
console.log("   deno task test:watch    # Run tests in watch mode");
console.log("   deno task test:coverage # Run with coverage");
console.log("");

Deno.exit(0);
