import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { createProject } from "./create.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";
import { fileExists } from "../utils/fileWriter.ts";
import { loadConfig } from "../utils/config.ts";

// Database integration tests are DISABLED by default for fast test runs.
// To enable full database integration tests, set: TONYSTACK_TEST_DB=true
// This requires:
// - PostgreSQL running locally
// - Sudo password configured in ~/.tonystack/config.json
// - Or sudo access without password prompt
const SKIP_DB_SETUP = Deno.env.get("TONYSTACK_TEST_DB") !== "true";

// Prefix for test databases to avoid conflicts with real databases
const TEST_DB_PREFIX = "tstack_cli_test_";

// Basic project creation tests (no flags)

Deno.test("createProject - creates project directory", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");
    const stat = await Deno.stat(projectPath);
    assertEquals(stat.isDirectory, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - copies all starter files", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");

    // Check key files exist
    assertEquals(await fileExists(join(projectPath, "deno.json")), true);
    assertEquals(await fileExists(join(projectPath, ".env.example")), true);
    assertEquals(
      await fileExists(join(projectPath, "docker-compose.yml")),
      true,
    );
    assertEquals(
      await fileExists(join(projectPath, "drizzle.config.ts")),
      true,
    );
    assertEquals(await fileExists(join(projectPath, "src", "main.ts")), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - creates .env from .env.example", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");
    const envPath = join(projectPath, ".env");

    assertEquals(await fileExists(envPath), true);

    const envContent = await Deno.readTextFile(envPath);
    assertEquals(envContent.length > 0, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - sets custom database name in .env", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my-api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "my-api");
    const envPath = join(projectPath, ".env");
    const envContent = await Deno.readTextFile(envPath);

    // Should contain my_api_dev (hyphens converted to underscores)
    assertEquals(envContent.includes("my_api_dev"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - updates docker-compose.yml with database name", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");
    const dockerPath = join(projectPath, "docker-compose.yml");
    const dockerContent = await Deno.readTextFile(dockerPath);

    // Docker compose uses environment variables, so it should have POSTGRES_DB variable
    assertEquals(dockerContent.includes("POSTGRES_DB:"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - creates migrations/_journal.json", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");
    const journalPath = join(
      projectPath,
      "migrations",
      "meta",
      "_journal.json",
    );

    assertEquals(await fileExists(journalPath), true);

    const journalContent = await Deno.readTextFile(journalPath);
    const journal = JSON.parse(journalContent);

    assertEquals(journal.version, "7");
    assertEquals(journal.dialect, "postgresql");
    assertEquals(Array.isArray(journal.entries), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - handles project names with hyphens", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my-cool-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "my-cool-app");
    const stat = await Deno.stat(projectPath);
    assertEquals(stat.isDirectory, true);

    // Database name should be my_cool_app_dev
    const envPath = join(projectPath, ".env");
    const envContent = await Deno.readTextFile(envPath);
    assertEquals(envContent.includes("my_cool_app_dev"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - handles project names with underscores", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my_app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "my_app");
    const stat = await Deno.stat(projectPath);
    assertEquals(stat.isDirectory, true);

    const envPath = join(projectPath, ".env");
    const envContent = await Deno.readTextFile(envPath);
    assertEquals(envContent.includes("my_app_dev"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - validates project name (letters only)", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "validname",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "validname");
    const stat = await Deno.stat(projectPath);
    assertEquals(stat.isDirectory, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - validates project name (alphanumeric)", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "app123",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "app123");
    const stat = await Deno.stat(projectPath);
    assertEquals(stat.isDirectory, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - deno.json has required imports", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");
    const denoJsonPath = join(projectPath, "deno.json");
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);

    // Check essential imports exist
    assertEquals(typeof denoJson.imports, "object");
    assertEquals(typeof denoJson.imports["hono"], "string");
    assertEquals(typeof denoJson.imports["drizzle-orm"], "string");
    assertEquals(typeof denoJson.imports["zod"], "string");
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - deno.json has required tasks", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");
    const denoJsonPath = join(projectPath, "deno.json");
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);

    // Check essential tasks exist
    assertEquals(typeof denoJson.tasks, "object");
    assertEquals(typeof denoJson.tasks["dev"], "string");
    assertEquals(typeof denoJson.tasks["migrate:generate"], "string");
    assertEquals(typeof denoJson.tasks["migrate:run"], "string");
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - copies src directory structure", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");

    // Check src structure
    assertEquals(await fileExists(join(projectPath, "src", "main.ts")), true);

    const configStat = await Deno.stat(join(projectPath, "src", "config"));
    assertEquals(configStat.isDirectory, true);

    const entitiesStat = await Deno.stat(
      join(projectPath, "src", "entities"),
    );
    assertEquals(entitiesStat.isDirectory, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("createProject - includes auth by default (starter template)", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app");
    const denoJsonPath = join(projectPath, "deno.json");
    const denoJsonContent = await Deno.readTextFile(denoJsonPath);
    const denoJson = JSON.parse(denoJsonContent);

    // Starter template includes jose by default
    assertEquals(typeof denoJson.imports["jose"], "string");
    assertEquals(denoJson.imports["jose"].includes("jose"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// ============================================================================
// DATABASE INTEGRATION TESTS
// ============================================================================
// These tests only run when TONYSTACK_TEST_DB=true
// They verify actual database creation in PostgreSQL

/**
 * Helper function to check if a PostgreSQL database exists
 * Uses config.sudoPassword to avoid password prompts
 */
async function databaseExists(dbName: string): Promise<boolean> {
  try {
    const config = await loadConfig();

    const cmd = config.sudoPassword
      ? new Deno.Command("sh", {
        args: [
          "-c",
          `echo "${config.sudoPassword}" | sudo -S -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${dbName}'"`,
        ],
        stdout: "piped",
        stderr: "piped",
      })
      : new Deno.Command("sudo", {
        args: [
          "-u",
          "postgres",
          "psql",
          "-tAc",
          `SELECT 1 FROM pg_database WHERE datname='${dbName}'`,
        ],
        stdout: "piped",
        stderr: "piped",
      });

    const { stdout } = await cmd.output();
    const result = new TextDecoder().decode(stdout).trim();
    return result === "1";
  } catch {
    return false;
  }
}

/**
 * Helper function to drop a database (cleanup after tests)
 * Uses config.sudoPassword to avoid password prompts
 */
async function dropDatabase(dbName: string): Promise<void> {
  try {
    const config = await loadConfig();

    const cmd = config.sudoPassword
      ? new Deno.Command("sh", {
        args: [
          "-c",
          `echo "${config.sudoPassword}" | sudo -S -u postgres psql -c "DROP DATABASE IF EXISTS ${dbName}"`,
        ],
        stdout: "piped",
        stderr: "piped",
      })
      : new Deno.Command("sudo", {
        args: [
          "-u",
          "postgres",
          "psql",
          "-c",
          `DROP DATABASE IF EXISTS ${dbName}`,
        ],
        stdout: "piped",
        stderr: "piped",
      });

    await cmd.output();
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Helper function to drop ALL test databases (ones with tstack_test_ prefix)
 * Useful for cleaning up before/after test runs
 */
async function cleanupAllTestDatabases(): Promise<void> {
  try {
    const config = await loadConfig();

    // Get list of all databases with tstack_test_ prefix
    const listCmd = config.sudoPassword
      ? new Deno.Command("sh", {
        args: [
          "-c",
          `echo "${config.sudoPassword}" | sudo -S -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname LIKE '${TEST_DB_PREFIX}%'"`,
        ],
        stdout: "piped",
        stderr: "piped",
      })
      : new Deno.Command("sudo", {
        args: [
          "-u",
          "postgres",
          "psql",
          "-tAc",
          `SELECT datname FROM pg_database WHERE datname LIKE '${TEST_DB_PREFIX}%'`,
        ],
        stdout: "piped",
        stderr: "piped",
      });

    const { stdout } = await listCmd.output();
    const databases = new TextDecoder().decode(stdout).trim().split("\n")
      .filter((db) => db.length > 0);

    // Drop each test database
    for (const db of databases) {
      await dropDatabase(db);
    }
  } catch {
    // Ignore errors during cleanup
  }
}

Deno.test({
  name: "createProject - creates development database (integration test)",
  ignore: SKIP_DB_SETUP, // Only runs when TONYSTACK_TEST_DB=true
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}dev_app`;
    const dbName = `${TEST_DB_PREFIX}dev_app_dev`;
    const testDbName = `${TEST_DB_PREFIX}dev_app_test`;
    const prodDbName = `${TEST_DB_PREFIX}dev_app_prod`;

    try {
      // Ensure databases don't exist before test
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await dropDatabase(prodDbName);

      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: false, // Actually create the database
      });

      // Verify development database was created
      const exists = await databaseExists(dbName);
      assertEquals(exists, true, `Database ${dbName} should exist`);
    } finally {
      // Cleanup
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await dropDatabase(prodDbName);
      await cleanupTempDir(tempDir);
    }
  },
});

Deno.test({
  name: "createProject - creates test database (integration test)",
  ignore: SKIP_DB_SETUP, // Only runs when TONYSTACK_TEST_DB=true
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}test_app`;
    const dbName = `${TEST_DB_PREFIX}test_app_dev`;
    const testDbName = `${TEST_DB_PREFIX}test_app_test`;
    const prodDbName = `${TEST_DB_PREFIX}test_app_prod`;

    try {
      // Ensure databases don't exist before test
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await dropDatabase(prodDbName);

      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: false, // Actually create the database
      });

      // Verify test database was created
      const exists = await databaseExists(testDbName);
      assertEquals(exists, true, `Database ${testDbName} should exist`);
    } finally {
      // Cleanup
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await dropDatabase(prodDbName);
      await cleanupTempDir(tempDir);
    }
  },
});

Deno.test({
  name:
    "createProject - creates ALL dev, test, and prod databases (integration test)",
  ignore: SKIP_DB_SETUP, // Only runs when TONYSTACK_TEST_DB=true
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}full_app`;
    const dbName = `${TEST_DB_PREFIX}full_app_dev`;
    const testDbName = `${TEST_DB_PREFIX}full_app_test`;
    const prodDbName = `${TEST_DB_PREFIX}full_app_prod`;

    try {
      // Ensure databases don't exist before test
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await dropDatabase(prodDbName);

      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: false, // Actually create the databases
      });

      // Verify ALL databases were created
      const devExists = await databaseExists(dbName);
      const testExists = await databaseExists(testDbName);
      const prodExists = await databaseExists(prodDbName);

      assertEquals(
        devExists,
        true,
        `Development database ${dbName} should exist`,
      );
      assertEquals(
        testExists,
        true,
        `Test database ${testDbName} should exist`,
      );
      assertEquals(
        prodExists,
        true,
        `Production database ${prodDbName} should exist`,
      );
    } finally {
      // Cleanup all databases
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await dropDatabase(prodDbName);
      await cleanupTempDir(tempDir);
    }
  },
});

// Cleanup hook: Remove all test databases after all tests complete
// This runs as the last test to ensure cleanup
Deno.test({
  name: "CLEANUP - Remove all tstack_test_* databases",
  ignore: SKIP_DB_SETUP,
  async fn() {
    await cleanupAllTestDatabases();
  },
});
