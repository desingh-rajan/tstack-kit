/**
 * Cleanup script for starter test database
 * - Drops the test database after tests complete
 * - Removes generated migration files (template ships clean)
 */

import "@std/dotenv/load";

const dbName = "tstack_starter_test";

// Step 1: Drop test database
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
  if (success) {
    console.log(`[CLEANUP] Database "${dbName}" dropped`);
  }
} catch (error) {
  console.error(`[WARNING] Could not drop database: ${error}`);
}

// Step 2: Clean up generated migration files (keep template clean)
try {
  const migrationsDir = "./migrations";
  const metaDir = "./migrations/meta";

  // Remove .sql files
  for await (const entry of Deno.readDir(migrationsDir)) {
    if (entry.isFile && entry.name.endsWith(".sql")) {
      await Deno.remove(`${migrationsDir}/${entry.name}`);
    }
  }

  // Remove entire meta/ directory (contains _journal.json and snapshot files)
  try {
    await Deno.remove(metaDir, { recursive: true });
  } catch {
    // meta dir might not exist
  }

  console.log("[CLEANUP] Generated migration files removed");
} catch {
  // migrations dir might not exist, that's fine
}
