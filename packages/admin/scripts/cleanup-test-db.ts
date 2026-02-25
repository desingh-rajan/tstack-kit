/**
 * Cleanup script for admin test database
 * Drops the test database after tests complete
 */

// Admin package uses its own test database
const dbName = "tstack_admin_test";
const dbUser = Deno.env.get("PGUSER") || "postgres";
const dbPassword = Deno.env.get("PGPASSWORD") || "password";

try {
  const cmd = new Deno.Command("psql", {
    args: [
      "-U",
      dbUser,
      "-h",
      "localhost",
      "-d",
      "postgres",
      "-c",
      `DROP DATABASE IF EXISTS ${dbName}`,
    ],
    env: { PGPASSWORD: dbPassword },
    stdout: "piped",
    stderr: "piped",
  });

  const { success } = await cmd.output();
  if (success) {
    console.log(`\n[CLEANUP] Cleanup: Database "${dbName}" dropped`);
  }
} catch (error) {
  console.error(`[WARNING]  Could not drop database: ${error}`);
}
