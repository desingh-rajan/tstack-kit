import { assertEquals } from "@std/assert";
import { assertNotEquals } from "@std/assert";
import { join } from "@std/path";
import { createProject } from "./create.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";
import { fileExists } from "../utils/fileWriter.ts";
import { loadConfig } from "../utils/config.ts";

/**
 * TODO: Add comprehensive edge case and error scenario tests
 * GitHub Issue: https://github.com/desingh-rajan/tstack-kit/issues/[TBD]
 *
 * Missing test coverage for:
 * 1. Invalid project names (starting with numbers, special chars, empty string, >255 chars)
 * 2. Directory exists but not tracked by CLI (manual creation outside tstack)
 * 3. Template path not found (corrupted installation)
 * 4. Very long names (>255 characters)
 * 5. Unicode/emoji in project names
 * 6. Version fetching failures (--latest with network offline)
 * 7. Disk full scenarios
 * 8. Permission denied errors (readonly target directory)
 * 9. Concurrent project creation (race conditions)
 * 10. Malformed deno.json in template
 * 11. Database connection failures (PostgreSQL not running)
 * 12. Template copy failures (partial file copy)
 */

// Database integration tests are DISABLED by default for fast test runs.
// To enable full database integration tests, set: TSTACK_TEST_DB=true
// This requires:
// - PostgreSQL running locally
// - Sudo password configured in ~/.tonystack/config.json
// - Or sudo access without password prompt
const SKIP_DB_SETUP = Deno.env.get("TSTACK_TEST_DB") !== "true";

// Prefix for test databases to avoid conflicts with real databases
const TEST_DB_PREFIX = "ts_cli_";

// Basic project creation tests (no flags)

Deno.test({
  name: "createProject - creates project directory",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "test-app",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: SKIP_DB_SETUP,
      });

      const projectPath = join(tempDir, "test-app-api");
      const stat = await Deno.stat(projectPath);
      assertEquals(stat.isDirectory, true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  },
});

Deno.test("createProject - copies all starter files", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "test-app",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app-api");

    // Check key files exist
    assertEquals(await fileExists(join(projectPath, "deno.json")), true);
    assertEquals(await fileExists(join(projectPath, ".env.example")), true);
    assertEquals(
      await fileExists(join(projectPath, "docker-compose.yml")),
      true
    );
    assertEquals(
      await fileExists(join(projectPath, "drizzle.config.ts")),
      true
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app-api");
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    // Smart detection: my-api already ends with -api, so folder stays my-api
    const projectPath = join(tempDir, "my-api");
    const envPath = join(projectPath, ".env");
    const envContent = await Deno.readTextFile(envPath);

    // Should contain my_api_dev (folder name with hyphens converted to underscores)
    assertEquals(envContent.includes("my_api_dev"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test(
  "createProject - updates docker-compose.yml with database name",
  async () => {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "test-app",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: SKIP_DB_SETUP,
      });

      const projectPath = join(tempDir, "test-app-api");
      const dockerPath = join(projectPath, "docker-compose.yml");
      const dockerContent = await Deno.readTextFile(dockerPath);

      // Docker compose uses environment variables, so it should have POSTGRES_DB variable
      assertEquals(dockerContent.includes("POSTGRES_DB:"), true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  }
);

Deno.test(
  "createProject - creates migrations/README.md (migrations generated by developer)",
  async () => {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "test-app",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: SKIP_DB_SETUP,
      });

      const projectPath = join(tempDir, "test-app-api");
      const readmePath = join(projectPath, "migrations", "README.md");

      // Template ships with README.md, developer runs migrate:generate to create migrations
      assertEquals(await fileExists(readmePath), true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  }
);

Deno.test("createProject - handles project names with hyphens", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my-cool-app",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "my-cool-app-api");
    const stat = await Deno.stat(projectPath);
    assertEquals(stat.isDirectory, true);

    // Database name should be my_cool_app_api_dev (folder name with underscores)
    const envPath = join(projectPath, ".env");
    const envContent = await Deno.readTextFile(envPath);
    assertEquals(envContent.includes("my_cool_app_api_dev"), true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test(
  "createProject - handles project names with underscores",
  async () => {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "my_app",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: SKIP_DB_SETUP,
      });

      const projectPath = join(tempDir, "my_app-api");
      const stat = await Deno.stat(projectPath);
      assertEquals(stat.isDirectory, true);

      const envPath = join(projectPath, ".env");
      const envContent = await Deno.readTextFile(envPath);
      assertEquals(envContent.includes("my_app_api_dev"), true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  }
);

Deno.test("createProject - validates project name (letters only)", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "validname",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "validname-api");
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "app123-api");
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app-api");
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app-api");
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: SKIP_DB_SETUP,
    });

    const projectPath = join(tempDir, "test-app-api");

    // Check src structure
    assertEquals(await fileExists(join(projectPath, "src", "main.ts")), true);

    const configStat = await Deno.stat(join(projectPath, "src", "config"));
    assertEquals(configStat.isDirectory, true);

    const entitiesStat = await Deno.stat(join(projectPath, "src", "entities"));
    assertEquals(entitiesStat.isDirectory, true);
  } finally {
    await cleanupTempDir(tempDir);
  }
});

Deno.test(
  "createProject - includes auth by default (starter template)",
  async () => {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "test-app",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: SKIP_DB_SETUP,
      });

      const projectPath = join(tempDir, "test-app-api");
      const denoJsonPath = join(projectPath, "deno.json");
      const denoJsonContent = await Deno.readTextFile(denoJsonPath);
      const denoJson = JSON.parse(denoJsonContent);

      // Starter template includes jose by default
      assertEquals(typeof denoJson.imports["jose"], "string");
      assertEquals(denoJson.imports["jose"].includes("jose"), true);
    } finally {
      await cleanupTempDir(tempDir);
    }
  }
);

// ============================================================================
// DATABASE INTEGRATION TESTS
// ============================================================================
// These tests only run when TSTACK_TEST_DB=true
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
    const databases = new TextDecoder()
      .decode(stdout)
      .trim()
      .split("\n")
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
  ignore: SKIP_DB_SETUP, // Only runs when TSTACK_TEST_DB=true
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}dev_app`;
    // Note: projectType defaults to 'api', so folder becomes project-api, database becomes project_api_*
    const dbName = `${TEST_DB_PREFIX}dev_app_api_dev`;
    const testDbName = `${TEST_DB_PREFIX}dev_app_api_test`;
    const prodDbName = `${TEST_DB_PREFIX}dev_app_api_prod`;

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
  ignore: SKIP_DB_SETUP, // Only runs when TSTACK_TEST_DB=true
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}test_app`;
    const dbName = `${TEST_DB_PREFIX}test_app_api_dev`;
    const testDbName = `${TEST_DB_PREFIX}test_app_api_test`;
    const prodDbName = `${TEST_DB_PREFIX}test_app_api_prod`;

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
  name: "createProject - creates ALL dev, test, and prod databases (integration test)",
  ignore: SKIP_DB_SETUP, // Only runs when TSTACK_TEST_DB=true
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}full_app`;
    const dbName = `${TEST_DB_PREFIX}full_app_api_dev`;
    const testDbName = `${TEST_DB_PREFIX}full_app_api_test`;
    const prodDbName = `${TEST_DB_PREFIX}full_app_api_prod`;

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
        `Development database ${dbName} should exist`
      );
      assertEquals(
        testExists,
        true,
        `Test database ${testDbName} should exist`
      );
      assertEquals(
        prodExists,
        true,
        `Production database ${prodDbName} should exist`
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
  name: "CLEANUP - Remove all ts_cli_* databases",
  ignore: SKIP_DB_SETUP,
  async fn() {
    await cleanupAllTestDatabases();
  },
});

// ============================================================================
// KV Store Integration Tests
// ============================================================================

import {
  deleteProject,
  getProject,
  listProjects,
} from "../utils/projectStore.ts";
import { exists } from "@std/fs";
import { assertExists } from "@std/assert";
import { closeKv } from "../utils/projectStore.ts";
import { initTestKv } from "../../tests/helpers/testKv.ts";

// Auto-detect test mode: Set TSTACK_CLI_TEST=true for isolated KV store
// This ensures tests don't pollute production project tracking
if (Deno.env.get("TSTACK_CLI_TEST") !== "true") {
  Deno.env.set("TSTACK_CLI_TEST", "true");
  console.log(
    "📝 Auto-enabled test mode: Using isolated KV store at ~/.tstack/projects-test.db"
  );
}

// Initialize test KV store before all tests
await initTestKv();

Deno.test({
  name: "createProject - should create folder with -api suffix",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "my-shop",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      // Check folder was created with -api suffix
      const expectedPath = join(tempDir, "my-shop-api");
      const folderExists = await exists(expectedPath, { isDirectory: true });

      assertEquals(
        folderExists,
        true,
        "Project folder should exist with -api suffix"
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("my-shop-api").catch(() => {});
      closeKv(); // Close KV connection to prevent leak
    }
  },
});

Deno.test(
  "createProject - should add entry to KV store with correct metadata",
  async () => {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "kv-test-shop",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      // Check KV store entry
      const metadata = await getProject("kv-test-shop-api");

      assertExists(metadata, "Project metadata should exist in KV store");
      assertEquals(
        metadata!.name,
        "kv-test-shop",
        "Should store original name"
      );
      assertEquals(metadata!.type, "api", "Should store project type");
      assertEquals(
        metadata!.folderName,
        "kv-test-shop-api",
        "Should store folder name with suffix"
      );
      assertEquals(
        metadata!.path,
        join(tempDir, "kv-test-shop-api"),
        "Should store correct path"
      );

      // Check databases are tracked
      assertExists(metadata!.databases, "Should track databases");
      assertEquals(
        metadata!.databases.dev,
        "kv_test_shop_api_dev",
        "Should track dev database"
      );
      assertEquals(
        metadata!.databases.test,
        "kv_test_shop_api_test",
        "Should track test database"
      );
      assertEquals(
        metadata!.databases.prod,
        "kv_test_shop_api_prod",
        "Should track prod database"
      );

      // Check timestamps
      assertExists(metadata!.createdAt, "Should have createdAt timestamp");
      assertExists(metadata!.updatedAt, "Should have updatedAt timestamp");
      assertEquals(
        typeof metadata!.createdAt,
        "number",
        "createdAt should be a number"
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("kv-test-shop-api").catch(() => {});
      closeKv();
    }
  }
);

// TODO: After refactoring, workspace type is no longer supported directly in create.ts
// Workspace projects should be created using workspace.ts command instead
// This test should be moved to workspace.test.ts
/*
Deno.test("createProject - workspace type should not have suffix", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "my-workspace",
      projectType: "workspace",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // Check folder was created WITHOUT suffix
    const expectedPath = join(tempDir, "my-workspace");
    const folderExists = await exists(expectedPath, { isDirectory: true });

    assertEquals(
      folderExists,
      true,
      "Workspace folder should exist without suffix",
    );

    // Check KV entry
    const metadata = await getProject("my-workspace");
    assertExists(metadata, "Workspace should be tracked");
    assertEquals(
      metadata!.folderName,
      "my-workspace",
      "Workspace should not have suffix",
    );
    assertEquals(metadata!.type, "workspace");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("my-workspace").catch(() => {});
    closeKv();
  }
});
*/

Deno.test("createProject - should track multiple projects", async () => {
  const tempDir = await createTempDir();
  try {
    await createProject({
      projectName: "multi-test-one",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    await createProject({
      projectName: "multi-test-two",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // List all projects
    const projects = await listProjects();

    // Should have at least our 2 test projects
    const ourProjects = projects.filter(
      (p) =>
        p.folderName === "multi-test-one-api" ||
        p.folderName === "multi-test-two-api"
    );

    assertEquals(ourProjects.length >= 2, true, "Should track both projects");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteProject("multi-test-one-api").catch(() => {});
    await deleteProject("multi-test-two-api").catch(() => {});
    closeKv();
  }
});

Deno.test(
  "createProject - should not duplicate suffix if already present",
  async () => {
    const tempDir = await createTempDir();
    try {
      // User provides "foo-shopy-api" as project name
      await createProject({
        projectName: "foo-shopy-api",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: SKIP_DB_SETUP,
      });

      // Should create "foo-shopy-api" folder, NOT "foo-shopy-api-api"
      const projectPath = join(tempDir, "foo-shopy-api");
      const wrongPath = join(tempDir, "foo-shopy-api-api");

      assertEquals(
        await exists(projectPath),
        true,
        "Should create foo-shopy-api folder"
      );
      assertEquals(
        await exists(wrongPath),
        false,
        "Should NOT create foo-shopy-api-api folder"
      );

      // Check KV store has correct folder name
      const metadata = await getProject("foo-shopy-api");
      assertExists(metadata, "Should find project in KV store");
      assertEquals(metadata!.folderName, "foo-shopy-api");
      assertEquals(metadata!.name, "foo-shopy-api");
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("foo-shopy-api").catch(() => {});
      closeKv();
    }
  }
);

Deno.test("KV store - should be created in home directory", async () => {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  assertExists(homeDir, "Should have HOME directory");

  const kvDir = join(homeDir!, ".tstack");

  // Check KV directory exists (created by previous tests)
  const kvDirExists = await exists(kvDir, { isDirectory: true });
  assertEquals(kvDirExists, true, ".tstack directory should exist in home");
  closeKv();
});

Deno.test("KV store - should use separate test database", async () => {
  const homeDir = Deno.env.get("HOME") || Deno.env.get("USERPROFILE");
  assertExists(homeDir, "Should have HOME directory");

  // Check that test KV store exists
  const testKvPath = join(homeDir!, ".tstack", "projects-test.db");
  const testKvExists = await exists(testKvPath);
  assertEquals(testKvExists, true, "Test KV store should exist separately");

  // Check that production KV exists (from manual CLI usage)
  const prodKvPath = join(homeDir!, ".tstack", "projects.db");
  const prodKvExists = await exists(prodKvPath);
  assertEquals(
    prodKvExists,
    true,
    "Production KV store should exist separately"
  );

  closeKv();
});

// ============================================================================
// CLEANUP: Remove all test entries from KV store after all tests
// ============================================================================

Deno.test("CLEANUP - Remove all test projects from KV store", async () => {
  const testProjects = [
    "my-shop-api",
    "kv-test-shop-api",
    "my-workspace",
    "multi-test-one-api",
    "multi-test-two-api",
    "status-test-api",
  ];

  for (const projectName of testProjects) {
    try {
      await deleteProject(projectName);
    } catch {
      // Project might not exist, that's fine
    }
  }

  closeKv();
});

// ============================================================================
// STATUS TRACKING TESTS
// ============================================================================

Deno.test(
  "Status tracking - should track status correctly and prevent duplicate in test mode",
  async () => {
    const tempDir = await createTempDir();

    try {
      // Create first project
      await createProject({
        projectName: "status-test",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const firstProject = await getProject("status-test-api");
      assertExists(firstProject, "First project should be tracked");
      assertEquals(
        firstProject?.status,
        "created",
        "Status should be 'created'"
      );
      assertExists(firstProject?.createdAt, "Should have createdAt timestamp");
      assertExists(firstProject?.updatedAt, "Should have updatedAt timestamp");

      // Try to create again without forceOverwrite - should throw error in test mode
      let errorThrown = false;
      try {
        await createProject({
          projectName: "status-test",
          projectType: "api",
          targetDir: tempDir,
          skipDbSetup: true,
          forceOverwrite: false,
        });
      } catch (error) {
        errorThrown = true;
        assertEquals(
          error instanceof Error && error.message.includes("already exists"),
          true,
          "Should throw 'already exists' error"
        );
      }
      assertEquals(
        errorThrown,
        true,
        "Should have thrown error for duplicate project in test mode"
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("status-test-api");
      closeKv();
    }
  }
);

Deno.test(
  "Status tracking - should allow recreation with forceOverwrite",
  async () => {
    const tempDir = await createTempDir();

    try {
      // Create first project
      await createProject({
        projectName: "status-test",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const firstProject = await getProject("status-test-api");
      const firstCreatedAt = firstProject?.createdAt;

      // Wait a bit to ensure timestamps differ
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Recreate with forceOverwrite
      await createProject({
        projectName: "status-test",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
        forceOverwrite: true,
      });

      const recreatedProject = await getProject("status-test-api");
      assertExists(recreatedProject, "Recreated project should be tracked");
      assertEquals(
        recreatedProject?.status,
        "created",
        "Status should be 'created'"
      );
      assertEquals(
        recreatedProject?.createdAt,
        firstCreatedAt,
        "createdAt should be preserved"
      );
      assertNotEquals(
        recreatedProject?.updatedAt,
        firstCreatedAt,
        "updatedAt should be different"
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("status-test-api");
      closeKv();
    }
  }
);

Deno.test(
  "Status tracking - should handle manually deleted folder",
  async () => {
    const tempDir = await createTempDir();

    try {
      // Create project
      await createProject({
        projectName: "status-test",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const projectPath = join(tempDir, "status-test-api");

      // Manually delete the folder
      await Deno.remove(projectPath, { recursive: true });

      // Recreate - should warn about missing folder and recreate
      await createProject({
        projectName: "status-test",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const recreatedProject = await getProject("status-test-api");
      assertExists(recreatedProject, "Recreated project should be tracked");
      assertEquals(
        recreatedProject?.status,
        "created",
        "Status should be 'created'"
      );

      // Verify folder was recreated
      const folderExists = await exists(projectPath);
      assertEquals(folderExists, true, "Folder should be recreated");
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("status-test-api");
      closeKv();
    }
  }
);

// --latest flag tests

Deno.test({
  name: "createProject - api: --latest flag updates dependencies",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "test-latest-api",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
        latest: true,
      });

      // Project name already ends in -api, so folder name won't be doubled
      const projectPath = join(tempDir, "test-latest-api");
      const denoJsonPath = join(projectPath, "deno.json");
      const denoJsonContent = await Deno.readTextFile(denoJsonPath);
      const denoJson = JSON.parse(denoJsonContent);

      // Verify imports exist (versions will be latest)
      assertExists(denoJson.imports["hono"], "Should have Hono import");
      assertExists(
        denoJson.imports["drizzle-orm"],
        "Should have Drizzle import"
      );
      assertExists(denoJson.imports["zod"], "Should have Zod import");

      // Version numbers should be updated (not the template defaults)
      const honoImport = denoJson.imports["hono"];
      assertEquals(
        honoImport.includes("jsr:@hono/hono@^"),
        true,
        "Should have JSR Hono import with version"
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("test-latest-api").catch(() => {});
      closeKv();
    }
  },
});

Deno.test(
  "createProject - api: without --latest uses template versions",
  async () => {
    const tempDir = await createTempDir();
    try {
      await createProject({
        projectName: "test-default-api",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
        latest: false,
      });

      // Project name already ends in -api, so folder name won't be doubled
      const projectPath = join(tempDir, "test-default-api");
      const denoJsonPath = join(projectPath, "deno.json");
      const denoJsonContent = await Deno.readTextFile(denoJsonPath);
      const denoJson = JSON.parse(denoJsonContent);

      // Should still have imports (from template)
      assertExists(denoJson.imports["hono"], "Should have Hono import");
      assertExists(
        denoJson.imports["drizzle-orm"],
        "Should have Drizzle import"
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteProject("test-default-api").catch(() => {});
      closeKv();
    }
  }
);
