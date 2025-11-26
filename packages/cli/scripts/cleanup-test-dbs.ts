#!/usr/bin/env -S deno run --allow-all

/**
 * Cleanup script to drop all test databases created by CLI tests
 *
 * Usage:
 *   deno run --allow-all scripts/cleanup-test-dbs.ts
 *
 * This script will:
 * 1. Find all databases matching test patterns
 * 2. Drop them to clean up after testing
 *
 * Database naming patterns from our tests:
 *
 * 1. create.test.ts & destroy.test.ts use TEST_DB_PREFIX = "ts_cli_"
 *    - ts_cli_dev_app_api_dev, ts_cli_dev_app_api_test, ts_cli_dev_app_api_prod
 *    - ts_cli_destroy_dev_api_dev, etc.
 *
 * 2. workspace.test.ts creates workspaces like "test-default-workspace"
 *    - Creates API projects: test-default-workspace-api
 *    - Database names: test_default_workspace_api_dev, test_default_workspace_api_test, test_default_workspace_api_prod
 *
 * 3. workspace.test.ts with GitHub tests uses generateWorkspaceName() = "test-ws-<timestamp>"
 *    - Creates: test_ws_<timestamp>_api_dev, etc.
 *
 * 4. list.test.ts creates: list-multi-one-<timestamp>, list-multi-ws-<timestamp>
 *    - Database names: list_multi_one_<timestamp>_api_dev, list_multi_ws_<timestamp>_api_dev
 */

// Databases to NEVER delete (production/system)
const PROTECTED_DATABASES = [
  "postgres",
  "template0",
  "template1",
  "tonystack",
];

const PROTECTED_PREFIXES = [
  "nomad_", // Production
  "blog_", // Production
];

// Test database patterns to clean (ONLY patterns our tests create)
const TEST_PATTERNS = [
  // create.test.ts & destroy.test.ts: TEST_DB_PREFIX = "ts_cli_"
  "ts_cli_%",

  // workspace.test.ts: static workspace names like "test-default-workspace"
  // Converted to DB: test_default_workspace_api_dev, etc.
  "test_default_workspace_%",
  "test_local_warning_%",
  "test_api_only_%",
  "test_skip_admin_%",
  "test_duplicate_%",
  "test_git_init_%",
  "test_admin_only_%",
  "test_destroy_%",

  // workspace.test.ts: dynamic names "test-ws-<timestamp>"
  // Converted to DB: test_ws_<timestamp>_api_dev, etc.
  "test_ws_%",

  // list.test.ts: "list-multi-one-<timestamp>", "list-multi-ws-<timestamp>"
  // Converted to DB: list_multi_%
  "list_multi_%",
];

async function listTestDatabases(): Promise<string[]> {
  try {
    // Build query to find test databases
    const protectedExact = PROTECTED_DATABASES.map((db) => `datname != '${db}'`)
      .join(" AND ");

    const protectedPrefixes = PROTECTED_PREFIXES.map((p) =>
      `datname NOT LIKE '${p}%'`
    ).join(" AND ");

    const includeConditions = TEST_PATTERNS.map((p) => `datname LIKE '${p}'`)
      .join(" OR ");

    const query =
      `SELECT datname FROM pg_database WHERE (${includeConditions}) AND ${protectedExact} AND ${protectedPrefixes}`;

    const cmd = new Deno.Command("psql", {
      args: ["-U", "postgres", "-h", "localhost", "-t", "-A", "-c", query],
      env: { PGPASSWORD: "password" },
      stdout: "piped",
      stderr: "piped",
    });

    const { stdout, success, stderr } = await cmd.output();

    if (!success) {
      const errMsg = new TextDecoder().decode(stderr);
      // If PostgreSQL not running, just return empty array (no DBs to clean)
      if (
        errMsg.includes("could not connect") ||
        errMsg.includes("Connection refused")
      ) {
        return [];
      }
      console.error("[ERROR] Failed to list databases:", errMsg);
      return [];
    }

    const databases = new TextDecoder().decode(stdout).trim().split("\n")
      .filter((db) => db.length > 0);

    return databases;
  } catch {
    // Silently fail if PostgreSQL is not available
    return [];
  }
}

/**
 * Exported function for use by test suites
 */
export async function cleanupTestDatabases(): Promise<{
  success: number;
  failed: number;
}> {
  const databases = await listTestDatabases();
  let successCount = 0;
  let failCount = 0;

  for (const db of databases) {
    const success = await dropDatabase(db);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  return { success: successCount, failed: failCount };
}

async function dropDatabase(dbName: string): Promise<boolean> {
  // Validate database name matches expected test patterns before dropping
  const isTestDatabase = TEST_PATTERNS.some((pattern) => {
    // Convert SQL LIKE pattern to regex (replace % with .*)
    const regexPattern = pattern.replace(/%/g, ".*");
    return new RegExp(`^${regexPattern}$`).test(dbName);
  });

  if (!isTestDatabase) {
    console.error(
      `[ERROR] Refusing to drop "${dbName}" - does not match test patterns`,
    );
    return false;
  }

  try {
    const cmd = new Deno.Command("psql", {
      args: [
        "-U",
        "postgres",
        "-h",
        "localhost",
        "-c",
        `DROP DATABASE IF EXISTS "${dbName}"`,
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

// Main execution (only runs when script is executed directly)
if (import.meta.main) {
  console.log("[INFO] Searching for test databases...");
  console.log("[INFO] Patterns:", TEST_PATTERNS.join(", "));
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
}
