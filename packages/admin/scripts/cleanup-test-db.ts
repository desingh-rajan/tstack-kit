/**
 * Cleanup script for admin test database
 * Drops the test database after tests complete
 */

// Admin package uses its own test database
const dbName = "tstack_admin_test_db";

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
