#!/usr/bin/env -S deno run --allow-all

/**
 * Cleanup script to drop all test databases with tstack_cli_test_ prefix
 *
 * Usage:
 *   deno run --allow-all scripts/cleanup-test-dbs.ts
 *
 * This script will:
 * 1. Find all databases with tstack_cli_test_ prefix
 * 2. Drop them to clean up after testing
 */

const TEST_DB_PREFIX = "tstack_cli_test_";

async function listTestDatabases(): Promise<string[]> {
  try {
    const cmd = new Deno.Command("psql", {
      args: [
        "-U",
        "postgres",
        "-h",
        "localhost",
        "-tAc",
        `SELECT datname FROM pg_database WHERE datname LIKE '${TEST_DB_PREFIX}%'`,
      ],
      env: { PGPASSWORD: "password" },
      stdout: "piped",
      stderr: "piped",
    });

    const { stdout, success } = await cmd.output();

    if (!success) {
      console.error("[ERROR] Failed to list databases. Is PostgreSQL running?");
      Deno.exit(1);
    }

    const databases = new TextDecoder().decode(stdout).trim().split("\n")
      .filter((db) => db.length > 0);

    return databases;
  } catch (error) {
    console.error(
      "[ERROR] Error listing databases:",
      error instanceof Error ? error.message : String(error),
    );
    Deno.exit(1);
  }
}

async function dropDatabase(dbName: string): Promise<boolean> {
  try {
    const cmd = new Deno.Command("psql", {
      args: [
        "-U",
        "postgres",
        "-h",
        "localhost",
        "-c",
        `DROP DATABASE IF EXISTS ${dbName}`,
      ],
      env: { PGPASSWORD: "password" },
      stdout: "piped",
      stderr: "piped",
    });

    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

// Main execution
console.log("[INFO] Searching for test databases with prefix:", TEST_DB_PREFIX);
console.log("");

const databases = await listTestDatabases();

if (databases.length === 0) {
  console.log("[SUCCESS] No test databases found. Nothing to clean up!");
  Deno.exit(0);
}

console.log(`Found ${databases.length} test database(s):`);
databases.forEach((db) => console.log(`  - ${db}`));
console.log("");

console.log("[INFO] Dropping test databases...");
console.log("");

let successCount = 0;
let failCount = 0;

for (const db of databases) {
  const success = await dropDatabase(db);
  if (success) {
    console.log(`[SUCCESS] Dropped: ${db}`);
    successCount++;
  } else {
    console.log(`[ERROR] Failed: ${db}`);
    failCount++;
  }
}

console.log("");
console.log("=".repeat(50));
console.log(`[SUCCESS] Successfully dropped: ${successCount}`);
if (failCount > 0) {
  console.log(`[ERROR] Failed to drop: ${failCount}`);
}
console.log("=".repeat(50));

if (failCount > 0) {
  Deno.exit(1);
}
