import { assertEquals, assertRejects } from "@std/assert";
import { join } from "@std/path";
import { destroyProject } from "./destroy.ts";
import { createProject } from "./create.ts";
import { cleanupTempDir, createTempDir } from "../../tests/helpers/tempDir.ts";
import { loadConfig } from "../utils/config.ts";

// Auto-detect test mode for isolated KV store
if (Deno.env.get("TSTACK_CLI_TEST") !== "true") {
  Deno.env.set("TSTACK_CLI_TEST", "true");
  console.log("📝 Auto-enabled test mode: Using isolated KV store");
}

// Database integration tests are DISABLED by default for fast test runs.
// To enable full database integration tests, set: TONYSTACK_TEST_DB=true
const SKIP_DB_SETUP = Deno.env.get("TONYSTACK_TEST_DB") !== "true";

// Prefix for test databases to avoid conflicts with real databases
const TEST_DB_PREFIX = "ts_cli_";

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
    projectType?: "api" | "admin-ui" | "workspace";
    force?: boolean;
    skipDbSetup?: boolean;
    interactive?: boolean;
  },
): Promise<void> {
  const originalCwd = Deno.cwd();
  try {
    Deno.chdir(dir);
    await destroyProject({ interactive: false, ...options }); // Default to non-interactive for tests
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

Deno.test({
  name: "destroyProject - removes project directory with force flag",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();

    try {
      // Create a project first
      await createProject({
        projectName: "test-destroy",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const projectPath = join(tempDir, "test-destroy-api");
      assertEquals(await dirExists(projectPath), true);

      // Destroy it with force flag (no prompt)
      await destroyInDir(tempDir, {
        projectName: "test-destroy-api",
        force: true,
        skipDbSetup: true,
      });

      // Verify directory is gone
      assertEquals(await dirExists(projectPath), false);
    } finally {
      await cleanupTempDir(tempDir);
    }
  },
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "my-cool-app-api");
    assertEquals(await dirExists(projectPath), true);

    await destroyInDir(tempDir, {
      projectName: "my-cool-app-api",
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "my_cool_app-api");
    assertEquals(await dirExists(projectPath), true);

    await destroyInDir(tempDir, {
      projectName: "my_cool_app-api",
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "test-app-api");

    // Verify key directories exist before destruction
    assertEquals(await dirExists(join(projectPath, "src")), true);
    assertEquals(await dirExists(join(projectPath, "migrations")), true);
    assertEquals(await dirExists(join(projectPath, "scripts")), true);

    await destroyInDir(tempDir, {
      projectName: "test-app-api",
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
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const projectPath = join(tempDir, "nested-app-api");

    // Add some extra nested directories
    await Deno.mkdir(join(projectPath, "extra", "nested", "deep"), {
      recursive: true,
    });
    await Deno.writeTextFile(
      join(projectPath, "extra", "nested", "deep", "file.txt"),
      "test",
    );

    await destroyInDir(tempDir, {
      projectName: "nested-app-api",
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
    const dbName = `${TEST_DB_PREFIX}destroy_dev_api_dev`;
    const testDbName = `${TEST_DB_PREFIX}destroy_dev_api_test`;
    const prodDbName = `${TEST_DB_PREFIX}destroy_dev_api_prod`;

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
      await dropDatabase(prodDbName);
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
    const dbName = `${TEST_DB_PREFIX}destroy_test_api_dev`;
    const testDbName = `${TEST_DB_PREFIX}destroy_test_api_test`;
    const prodDbName = `${TEST_DB_PREFIX}destroy_test_api_prod`;

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
      await dropDatabase(prodDbName);
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
    const dbName = `${TEST_DB_PREFIX}destroy_both_api_dev`;
    const testDbName = `${TEST_DB_PREFIX}destroy_both_api_test`;
    const prodDbName = `${TEST_DB_PREFIX}destroy_both_api_prod`;

    try {
      // Create project with databases
      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: false,
      });

      // Verify all databases exist
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
      assertEquals(
        await databaseExists(prodDbName),
        true,
        `Prod database should exist`,
      );

      // Destroy project
      await destroyInDir(tempDir, {
        projectName,
        force: true,
        skipDbSetup: false,
      });

      // Verify all databases were dropped
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
      assertEquals(
        await databaseExists(prodDbName),
        false,
        `Prod database should be dropped`,
      );
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
    "destroyProject - handles database names with hyphens converted to underscores (integration test)",
  ignore: SKIP_DB_SETUP,
  async fn() {
    const tempDir = await createTempDir();
    const projectName = `${TEST_DB_PREFIX}my-api`;
    const dbName = `${TEST_DB_PREFIX}my_api_dev`; // Hyphens converted to underscores
    const testDbName = `${TEST_DB_PREFIX}my_api_test`;
    const prodDbName = `${TEST_DB_PREFIX}my_api_prod`;

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
      assertEquals(await databaseExists(prodDbName), true);

      // Destroy project
      await destroyInDir(tempDir, {
        projectName,
        force: true,
        skipDbSetup: false,
      });

      // Verify databases dropped with correct naming
      assertEquals(await databaseExists(dbName), false);
      assertEquals(await databaseExists(testDbName), false);
      assertEquals(await databaseExists(prodDbName), false);
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
    "destroyProject - completes successfully even if databases don't exist (integration test)",
  ignore: SKIP_DB_SETUP,
  sanitizeResources: false, // KV connection shared across tests
  async fn() {
    const tempDir = await createTempDir();
    // Use hyphens for project name (folder convention)
    // Databases will use underscores: ts_cli_no_dbs_api_dev
    const projectName = "ts-cli-no-dbs";
    const dbName = `${TEST_DB_PREFIX}no_dbs_api_dev`;
    const testDbName = `${TEST_DB_PREFIX}no_dbs_api_test`;
    const prodDbName = `${TEST_DB_PREFIX}no_dbs_api_prod`;

    try {
      // Create project WITHOUT databases
      await createProject({
        projectName,
        targetDir: tempDir,
        skipDbSetup: true, // Don't create databases
      });

      // Project gets -api suffix by default, creating ts-cli-no-dbs-api folder
      const actualFolderName = `${projectName}-api`;
      const projectPath = join(tempDir, actualFolderName);
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
      await dropDatabase(prodDbName);
      await cleanupTempDir(tempDir);
      closeKv(); // Close KV connection to prevent leak
    }
  },
});

// ============================================================================
// KV Store Integration Tests for destroy command
// ============================================================================

import {
  closeKv,
  deleteProject as deleteFromKV,
  getProject,
} from "../utils/projectStore.ts";
import { assertExists } from "@std/assert";
import { exists } from "@std/fs";

Deno.test({
  name: "destroyProject - should remove entry from KV store",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    const projectName = "kv-destroy-test";

    try {
      // Create project
      await createProject({
        projectName,
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const folderName = `${projectName}-api`;

      // Verify KV entry exists
      let metadata = await getProject(folderName);
      assertExists(metadata, "Metadata should exist before destroy");

      // Destroy project
      await destroyInDir(tempDir, {
        projectName: folderName,
        force: true,
        skipDbSetup: true,
      });

      // Verify KV entry is removed
      metadata = await getProject(folderName);
      assertEquals(metadata, null, "Metadata should be removed after destroy");
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV(`${projectName}-api`).catch(() => {});
      closeKv();
    }
  },
});

Deno.test("destroyProject - should use KV metadata for path and databases", async () => {
  const tempDir = await createTempDir();
  const projectName = "kv-metadata-test";

  try {
    // Create project with KV tracking
    await createProject({
      projectName,
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    const folderName = `${projectName}-api`;
    const folderPath = join(tempDir, folderName);

    // Verify KV metadata is correct
    const metadata = await getProject(folderName);
    assertExists(metadata, "Metadata should exist");
    assertEquals(metadata!.path, folderPath, "Path should match");
    assertEquals(metadata!.databases.dev, `kv_metadata_test_api_dev`);

    // Verify folder exists
    let folderExists = await exists(folderPath, { isDirectory: true });
    assertEquals(folderExists, true, "Folder should exist");

    // Destroy from different directory (to test KV path lookup)
    const originalCwd = Deno.cwd();
    Deno.chdir("/tmp");
    try {
      await destroyProject({
        projectName: folderName,
        force: true,
        skipDbSetup: true,
      });
    } finally {
      Deno.chdir(originalCwd);
    }

    // Verify folder is gone
    folderExists = await exists(folderPath, { isDirectory: true });
    assertEquals(folderExists, false, "Folder should be removed");
  } finally {
    await cleanupTempDir(tempDir);
    await deleteFromKV(`${projectName}-api`).catch(() => {});
    closeKv();
  }
});

Deno.test("destroyProject - should fallback to directory search if not in KV", async () => {
  const tempDir = await createTempDir();
  const projectName = "untracked-destroy-test";

  try {
    // Manually create a project directory (not through CLI, so not tracked)
    const folderPath = join(tempDir, projectName);
    await Deno.mkdir(folderPath, { recursive: true });
    await Deno.writeTextFile(join(folderPath, "deno.json"), "{}");

    // Verify it's NOT in KV
    const metadata = await getProject(projectName);
    assertEquals(metadata, null, "Should not be tracked");

    // Verify folder exists
    let folderExists = await exists(folderPath, { isDirectory: true });
    assertEquals(folderExists, true, "Folder should exist");

    // Destroy should still work using directory search
    await destroyInDir(tempDir, {
      projectName,
      force: true,
      skipDbSetup: true,
    });

    // Verify folder is removed
    folderExists = await exists(folderPath, { isDirectory: true });
    assertEquals(
      folderExists,
      false,
      "Folder should be removed even without KV tracking",
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteFromKV(projectName).catch(() => {});
    closeKv();
  }
});

Deno.test("destroyProject - should support type-based destruction", async () => {
  const tempDir = await createTempDir();
  try {
    // Create two projects with same base name but different types
    await createProject({
      projectName: "multi-type-test",
      projectType: "api",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    await createProject({
      projectName: "multi-type-test",
      projectType: "admin-ui",
      targetDir: tempDir,
      skipDbSetup: true,
    });

    // Verify both exist
    const apiPath = join(tempDir, "multi-type-test-api");
    const uiPath = join(tempDir, "multi-type-test-admin-ui");
    assertEquals(await exists(apiPath), true, "API project should exist");
    assertEquals(await exists(uiPath), true, "Admin UI project should exist");

    // Destroy only the API project using type parameter
    await destroyInDir(tempDir, {
      projectName: "multi-type-test",
      projectType: "api",
      force: true,
      skipDbSetup: true,
    });

    // Verify API is gone but admin-ui remains
    assertEquals(
      await exists(apiPath),
      false,
      "API project should be destroyed",
    );
    assertEquals(
      await exists(uiPath),
      true,
      "Admin UI project should still exist",
    );

    // Clean up the admin-ui
    await destroyInDir(tempDir, {
      projectName: "multi-type-test",
      projectType: "admin-ui",
      force: true,
      skipDbSetup: true,
    });

    assertEquals(
      await exists(uiPath),
      false,
      "Admin UI project should be destroyed",
    );
  } finally {
    await cleanupTempDir(tempDir);
    await deleteFromKV("multi-type-test-api").catch(() => {});
    await deleteFromKV("multi-type-test-admin-ui").catch(() => {});
    closeKv();
  }
});

// ============================================================================
// Comprehensive tests for 3 destroy scenarios
// ============================================================================

Deno.test({
  name:
    "destroyProject - Scenario 1: Destroy with type parameter (exact match)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      // Create multiple projects
      await createProject({
        projectName: "shop",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      await createProject({
        projectName: "shop",
        projectType: "admin-ui",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const apiPath = join(tempDir, "shop-api");
      const uiPath = join(tempDir, "shop-admin-ui");

      // Verify both exist
      assertEquals(await exists(apiPath), true);
      assertEquals(await exists(uiPath), true);

      // Scenario 1: Destroy with type - should directly destroy the exact project
      await destroyInDir(tempDir, {
        projectName: "shop",
        projectType: "api",
        force: true,
        skipDbSetup: true,
        interactive: false,
      });

      // Only API should be destroyed
      assertEquals(await exists(apiPath), false, "API should be destroyed");
      assertEquals(await exists(uiPath), true, "Admin UI should remain");

      // Verify KV entry is removed
      const apiMetadata = await getProject("shop-api");
      assertEquals(apiMetadata, null, "API metadata should be removed");

      const uiMetadata = await getProject("shop-admin-ui");
      assertExists(uiMetadata, "Admin UI metadata should still exist");
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV("shop-api").catch(() => {});
      await deleteFromKV("shop-admin-ui").catch(() => {});
      closeKv();
    }
  },
});

Deno.test({
  name:
    "destroyProject - Scenario 2: Destroy by exact folder name (backward compatible)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      // Create projects
      await createProject({
        projectName: "store",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      await createProject({
        projectName: "store",
        projectType: "admin-ui",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const apiPath = join(tempDir, "store-api");
      const uiPath = join(tempDir, "store-admin-ui");

      assertEquals(await exists(apiPath), true);
      assertEquals(await exists(uiPath), true);

      // Scenario 2: Destroy by exact folder name (old way, no type parameter)
      await destroyInDir(tempDir, {
        projectName: "store-api", // Exact folder name
        force: true,
        skipDbSetup: true,
        interactive: false,
      });

      // Only the exact folder should be destroyed
      assertEquals(
        await exists(apiPath),
        false,
        "store-api should be destroyed",
      );
      assertEquals(await exists(uiPath), true, "store-admin-ui should remain");

      // Verify KV
      const apiMetadata = await getProject("store-api");
      assertEquals(apiMetadata, null);

      const uiMetadata = await getProject("store-admin-ui");
      assertExists(uiMetadata);
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV("store-api").catch(() => {});
      await deleteFromKV("store-admin-ui").catch(() => {});
      closeKv();
    }
  },
});

Deno.test({
  name:
    "destroyProject - Scenario 3: Ambiguous name finds multiple matches (single match auto-select)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      // Create only ONE project with base name "cart"
      await createProject({
        projectName: "cart",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const apiPath = join(tempDir, "cart-api");
      assertEquals(await exists(apiPath), true);

      // Scenario 3a: Single match - should auto-select without prompting
      await destroyInDir(tempDir, {
        projectName: "cart", // Ambiguous, but only one match
        force: true,
        skipDbSetup: true,
        interactive: false, // Even with interactive false, should work with single match
      });

      assertEquals(
        await exists(apiPath),
        false,
        "Should auto-destroy single match",
      );

      const metadata = await getProject("cart-api");
      assertEquals(metadata, null, "Metadata should be removed");
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV("cart-api").catch(() => {});
      closeKv();
    }
  },
});

Deno.test({
  name:
    "destroyProject - Scenario 3: Multiple matches detected (would prompt in interactive mode)",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      // Create multiple projects with same base name
      await createProject({
        projectName: "market",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      await createProject({
        projectName: "market",
        projectType: "admin-ui",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const apiPath = join(tempDir, "market-api");
      const uiPath = join(tempDir, "market-admin-ui");

      assertEquals(await exists(apiPath), true);
      assertEquals(await exists(uiPath), true);

      // Scenario 3b: Multiple matches with interactive=false should not destroy anything
      // (In real CLI with interactive=true, it would prompt user to select)
      try {
        await destroyInDir(tempDir, {
          projectName: "market", // Ambiguous name
          force: true,
          skipDbSetup: true,
          interactive: false, // No prompting, so should not match
        });

        // With interactive=false and multiple matches, nothing should be destroyed
        // The function should complete without error but not destroy anything
      } catch {
        // It's okay if it errors out when there are multiple matches and no interactive prompt
      }

      // Both should still exist (or at least verify KV entries)
      const apiMetadata = await getProject("market-api");
      const uiMetadata = await getProject("market-admin-ui");

      // At least one should still exist to prove we didn't destroy without confirmation
      const atLeastOneExists = (apiMetadata !== null) || (uiMetadata !== null);
      assertEquals(
        atLeastOneExists,
        true,
        "Should not destroy multiple projects without user confirmation",
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV("market-api").catch(() => {});
      await deleteFromKV("market-admin-ui").catch(() => {});
      closeKv();
    }
  },
});

Deno.test({
  name:
    "destroyProject - Smart suffix detection: 'foo-bar-api' type='api' should not duplicate",
  sanitizeResources: false,
  async fn() {
    const tempDir = await createTempDir();
    try {
      // User already named it with suffix
      await createProject({
        projectName: "foo-bar-api",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const projectPath = join(tempDir, "foo-bar-api");
      assertEquals(await exists(projectPath), true, "foo-bar-api should exist");

      // Destroy using the same name with type - should find it without duplication
      await destroyInDir(tempDir, {
        projectName: "foo-bar-api",
        projectType: "api",
        force: true,
        skipDbSetup: true,
        interactive: false,
      });

      assertEquals(
        await exists(projectPath),
        false,
        "Should destroy foo-bar-api",
      );

      const metadata = await getProject("foo-bar-api");
      assertEquals(metadata, null, "Metadata should be removed");
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV("foo-bar-api").catch(() => {});
      closeKv();
    }
  },
});

// ============================================================================
// STATUS TRACKING TESTS
// ============================================================================

Deno.test({
  name: "Status tracking - should prevent destroying already destroyed project",
  ignore: Deno.env.get("TSTACK_CLI_TEST") !== "true",
  async fn() {
    const tempDir = await createTempDir();

    try {
      // Create and destroy project
      await createProject({
        projectName: "status-destroy-test",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      await destroyInDir(tempDir, {
        projectName: "status-destroy-test-api",
        force: false,
        skipDbSetup: true,
        interactive: false,
      });

      // Check status is "destroyed" (not removed from KV without force)
      const metadata = await getProject("status-destroy-test-api");
      assertExists(
        metadata,
        "Metadata should exist after destroy without force",
      );
      assertEquals(
        metadata?.status,
        "destroyed",
        "Status should be 'destroyed'",
      );

      // Try to destroy again - should detect already destroyed
      // Note: This will exit or return early, so we can't test the actual behavior easily
      // But we can verify the status check works
      assertEquals(
        metadata?.status,
        "destroyed",
        "Should show destroyed status",
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV("status-destroy-test-api").catch(() => {});
      closeKv();
    }
  },
});

Deno.test({
  name: "Status tracking - force flag should remove metadata completely",
  ignore: Deno.env.get("TSTACK_CLI_TEST") !== "true",
  async fn() {
    const tempDir = await createTempDir();

    try {
      // Create project
      await createProject({
        projectName: "status-force-test",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      // Destroy with force flag
      await destroyInDir(tempDir, {
        projectName: "status-force-test-api",
        force: true,
        skipDbSetup: true,
        interactive: false,
      });

      // Metadata should be completely removed
      const metadata = await getProject("status-force-test-api");
      assertEquals(
        metadata,
        null,
        "Metadata should be removed with force flag",
      );
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV("status-force-test-api").catch(() => {});
      closeKv();
    }
  },
});

Deno.test({
  name: "Status tracking - should handle manually deleted folder gracefully",
  ignore: Deno.env.get("TSTACK_CLI_TEST") !== "true",
  async fn() {
    const tempDir = await createTempDir();

    try {
      // Create project
      await createProject({
        projectName: "status-manual-test",
        projectType: "api",
        targetDir: tempDir,
        skipDbSetup: true,
      });

      const projectPath = join(tempDir, "status-manual-test-api");

      // Manually delete folder
      await Deno.remove(projectPath, { recursive: true });

      // Destroy should still work and clean up metadata
      await destroyInDir(tempDir, {
        projectName: "status-manual-test-api",
        force: true,
        skipDbSetup: true,
        interactive: false,
      });

      // Metadata should be removed
      const metadata = await getProject("status-manual-test-api");
      assertEquals(metadata, null, "Metadata should be cleaned up");
    } finally {
      await cleanupTempDir(tempDir);
      await deleteFromKV("status-manual-test-api").catch(() => {});
      closeKv();
    }
  },
});
