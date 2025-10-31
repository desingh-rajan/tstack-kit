#!/usr/bin/env -S deno run --allow-all

/**
 * Test Environment Health Check
 *
 * Quick validation that your test environment is ready
 * Usage: deno run --allow-all scripts/test-health-check.ts
 */

import { loadSync } from "@std/dotenv";

console.log("🏥 TonyStack Test Health Check");
console.log("=".repeat(40));

// Set test environment (Deno-style)
Deno.env.set("ENVIRONMENT", "test");

let allGood = true;

// Check 1: Environment files
console.log("\n📁 Checking environment files...");
try {
  loadSync({ envPath: ".env.test", export: true });
  console.log("   ✅ .env.test loaded");
} catch {
  try {
    loadSync({ envPath: ".env", export: true });
    console.log("   ⚠️  Using .env (no .env.test found)");
  } catch {
    console.log("   ❌ No environment file found");
    allGood = false;
  }
}

// Check 2: Database connection
console.log("\n🗄️  Checking database connection...");
try {
  const { db } = await import("../src/config/database.ts");

  // Test basic connection
  await db.execute("SELECT 1");
  console.log("   ✅ Database connection successful");

  // Check test users
  const users = await db.execute(
    "SELECT email FROM users WHERE email IN ('superadmin@tstack.in', 'alpha@tstack.in')",
  );

  if (users.length === 2) {
    console.log("   ✅ Test users present");
  } else {
    console.log(`   ⚠️  Only ${users.length}/2 test users found`);
    console.log("   💡 Run: deno task test:seed");
  }

  await db.$client.end();
} catch (error) {
  console.log("   ❌ Database connection failed");
  console.log(`   💡 Run: deno task test:setup`);
  console.log(
    `   Error: ${error instanceof Error ? error.message : String(error)}`,
  );
  allGood = false;
}

// Check 3: Test files
console.log("\n🧪 Checking test files...");
try {
  await Deno.stat("src/auth/auth.test.ts");
  console.log("   ✅ auth.test.ts found");
} catch {
  console.log("   ⚠️  auth.test.ts not found");
}

try {
  await Deno.stat("src/entities/articles/article.test.ts");
  console.log("   ✅ article.test.ts found");
} catch {
  console.log("   ⚠️  article.test.ts not found");
}

// Final verdict
console.log("\n" + "=".repeat(40));
if (allGood) {
  console.log("🎉 Test environment is healthy!");
  console.log("");
  console.log("🚀 Ready to run:");
  console.log("   deno task test");
  console.log("   deno task test:watch");
} else {
  console.log("🔧 Test environment needs setup!");
  console.log("");
  console.log("🛠️  Try these commands:");
  console.log("   deno task test:full    # Complete setup + tests");
  console.log("   deno task test:reset   # Reset everything");
}
console.log("");

Deno.exit(allGood ? 0 : 1);
