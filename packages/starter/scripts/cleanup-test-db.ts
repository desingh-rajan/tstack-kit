/**
 * Cleanup script for starter test database
 * Drops the test database after tests complete
 */

import "@std/dotenv/load";

const dbName = "tstack_starter_test_db";

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
    console.log(`\n🧹 Cleanup: Database "${dbName}" dropped`);
  }
} catch (error) {
  console.error(`⚠️  Could not drop database: ${error}`);
}
