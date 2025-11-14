import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { destroyProject } from "./destroy.ts";
import { createProject } from "./create.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";
import { loadConfig } from "../utils/config.ts";

// Database integration tests are DISABLED by default for fast test runs.
// To enable full database integration tests, set: TONYSTACK_TEST_DB=true
const SKIP_DB_SETUP = Deno.env.get("TONYSTACK_TEST_DB") !== "true";

// Prefix for test databases to avoid conflicts with real databases
const TEST_DB_PREFIX = "tstack_cli_test_";

/**
 * Helper to check if a directory exists
 */
async function dirExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

/**
 * Helper function to run destroy in a specific directory context
 * Changes CWD temporarily to the target directory
 */
async function destroyInDir(
  dir: string,
  options: {
    projectName: string;
    force?: boolean;
    skipDbSetup?: boolean;
  },
): Promise<void> {
  const originalCwd = Deno.cwd();
  try {
    Deno.chdir(dir);
    await destroyProject(options);
  } finally {
    Deno.chdir(originalCwd);
  }
}

/**
 * Helper function to check if a PostgreSQL database exists
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

// ============================================================================
// BASIC DESTROY TESTS (No Databases)
// ============================================================================

Deno.test("destroyProject - removes project directory with force flag", async () => {
  const tempDir = await createTempDir();

  try {
    // Create a project first
    await createProject({
      projectName: "test-destroy",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-destroy");
    assertEquals(await dirExists(projectPath), true);

    // Destroy it with force flag (no prompt)
    await destroyInDir(tempDir, {
      projectName: "test-destroy",
      force: true,
      skipDbSetup: true,
    });

    // Verify directory is gone
    assertEquals(await dirExists(projectPath), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("destroyProject - fails when project doesn't exist", async () => {
  await assertRejects(
    async () => {
      await destroyProject({
        projectName: "nonexistent-project-xyz",
        force: true,
        skipDbSetup: true,
      });
    },
    Error,
    "not found",
  );
});

Deno.test("destroyProject - handles project with hyphens in name", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my-cool-app",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "my-cool-app");
    assertEquals(await dirExists(projectPath), true);

    await destroyInDir(tempDir, {
      projectName: "my-cool-app",
      force: true,
      skipDbSetup: true,
    });

    assertEquals(await dirExists(projectPath), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("destroyProject - handles project with underscores in name", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my_cool_app",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "my_cool_app");
    assertEquals(await dirExists(projectPath), true);

    await destroyInDir(tempDir, {
      projectName: "my_cool_app",
      force: true,
      skipDbSetup: true,
    });

    assertEquals(await dirExists(projectPath), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("destroyProject - removes all project files and subdirectories", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-app");

    // Verify key directories exist before destruction
    assertEquals(await dirExists(join(projectPath, "src")), true);
    assertEquals(await dirExists(join(projectPath, "migrations")), true);
    assertEquals(await dirExists(join(projectPath, "scripts")), true);

    await destroyInDir(tempDir, {
      projectName: "test-app",
      force: true,
      skipDbSetup: true,
    });

    // Verify entire project is gone
    assertEquals(await dirExists(projectPath), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test("destroyProject - handles nested directory structure", async () => {
  const tempDir = await createTempDir();
  try {
    // Create project with nested files
    await createProject({
      projectName: "nested-app",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "nested-app");

    // Add some extra nested directories
    await Deno.mkdir(join(projectPath, "extra", "nested", "deep"), {
      recursive: true,
    });
    await Deno.writeTextFile(
      join(projectPath, "extra", "nested", "deep", "file.txt"),
      "test",
    );

    await destroyInDir(tempDir, {
      projectName: "nested-app",
      force: true,
      skipDbSetup: true,
    });

    assertEquals(await dirExists(projectPath), false);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

// ============================================================================
// DATABASE INTEGRATION TESTS
// ============================================================================
// These tests only run when TONYSTACK_TEST_DB=true
// They verify actual database deletion in PostgreSQL

Deno.test({
  name: "destroyProject - drops development database (integration test)",
  ignore: SKIP_DB_SETUP,
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}destroy_dev`;
    const dbName = `${TEST_DB_PREFIX}destroy_dev_db`;
    const testDbName = `${TEST_DB_PREFIX}destroy_dev_db_test`;

    try {
      // Create project with databases
      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: false, // Actually create databases
      });

      // Verify databases exist
      assertEquals(
        await databaseExists(dbName),
        true,
        `Database ${dbName} should exist before destroy`,
      );

      // Destroy project with databases
      await destroyInDir(tempDir, {
        projectName,
        force: true,
        skipDbSetup: false, // Actually drop databases
      });

      // Verify database was dropped
      assertEquals(
        await databaseExists(dbName),
        false,
        `Database ${dbName} should be dropped`,
      );
    } finally {
      // Cleanup
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await cleanupTempDir(tempDir);
    }
  },
});

Deno.test({
  name: "destroyProject - drops test database (integration test)",
  ignore: SKIP_DB_SETUP,
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}destroy_test`;
    const dbName = `${TEST_DB_PREFIX}destroy_test_db`;
    const testDbName = `${TEST_DB_PREFIX}destroy_test_db_test`;

    try {
      // Create project with databases
      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: false,
      });

      // Verify test database exists
      assertEquals(
        await databaseExists(testDbName),
        true,
        `Database ${testDbName} should exist before destroy`,
      );

      // Destroy project
      await destroyInDir(tempDir, {
        projectName,
        force: true,
        skipDbSetup: false,
      });

      // Verify test database was dropped
      assertEquals(
        await databaseExists(testDbName),
        false,
        `Database ${testDbName} should be dropped`,
      );
    } finally {
      // Cleanup
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await cleanupTempDir(tempDir);
    }
  },
});

Deno.test({
  name: "destroyProject - drops BOTH dev and test databases (integration test)",
  ignore: SKIP_DB_SETUP,
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}destroy_both`;
    const dbName = `${TEST_DB_PREFIX}destroy_both_db`;
    const testDbName = `${TEST_DB_PREFIX}destroy_both_db_test`;

    try {
      // Create project with databases
      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: false,
      });

      // Verify both databases exist
      assertEquals(
        await databaseExists(dbName),
        true,
        `Dev database should exist`,
      );
      assertEquals(
        await databaseExists(testDbName),
        true,
        `Test database should exist`,
      );

      // Destroy project
      await destroyInDir(tempDir, {
        projectName,
        force: true,
        skipDbSetup: false,
      });

      // Verify both databases were dropped
      assertEquals(
        await databaseExists(dbName),
        false,
        `Dev database should be dropped`,
      );
      assertEquals(
        await databaseExists(testDbName),
        false,
        `Test database should be dropped`,
      );
    } finally {
      // Cleanup
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await cleanupTempDir(tempDir);
    }
  },
});

Deno.test({
  name:
    "destroyProject - handles database names with hyphens converted to underscores (integration test)",
  ignore: SKIP_DB_SETUP,
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}my-api`;
    const dbName = `${TEST_DB_PREFIX}my_api_db`; // Hyphens converted to underscores
    const testDbName = `${TEST_DB_PREFIX}my_api_db_test`;

    try {
      // Create project with databases
      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: false,
      });

      // Verify databases exist with correct naming
      assertEquals(await databaseExists(dbName), true);
      assertEquals(await databaseExists(testDbName), true);

      // Destroy project
      await destroyInDir(tempDir, {
        projectName,
        force: true,
        skipDbSetup: false,
      });

      // Verify databases dropped with correct naming
      assertEquals(await databaseExists(dbName), false);
      assertEquals(await databaseExists(testDbName), false);
    } finally {
      // Cleanup
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await cleanupTempDir(tempDir);
    }
  },
});

Deno.test({
  name:
    "destroyProject - completes successfully even if databases don't exist (integration test)",
  ignore: SKIP_DB_SETUP,
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}no_dbs`;
    const dbName = `${TEST_DB_PREFIX}no_dbs_db`;
    const testDbName = `${TEST_DB_PREFIX}no_dbs_db_test`;

    try {
      // Create project WITHOUT databases
      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: true, // Don't create databases
      });

      const projectPath = join(tempDir, projectName);
      assertEquals(await dirExists(projectPath), true);

      // Try to destroy (should succeed even though DBs don't exist)
      await destroyInDir(tempDir, {
        projectName,
        force: true,
        skipDbSetup: false, // Try to drop databases (but they don't exist)
      });

      // Verify project directory removed
      assertEquals(await dirExists(projectPath), false);
    } finally {
      // Cleanup just in case
      await dropDatabase(dbName);
      await dropDatabase(testDbName);
      await cleanupTempDir(tempDir);
    }
  },
});
